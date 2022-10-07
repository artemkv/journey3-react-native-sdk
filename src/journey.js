import { createSessionHeader, createSession, createSessionFlush, createStage } from './domain.js';
import persistence from './persistence.js';
import restReal from './rest.js';
import {
    isSameYear,
    isSameMonth,
    isSameDay,
    isSameHour,
} from './dateutil.js';
import { newId } from './idgen.js';

const MAX_SEQ_LENGTH = 100;

let _persistence = persistence;
let _rest = restReal;
let _getNowUtc = () => new Date();
let _getNewId = newId;

export const config = (persistence, rest, getNowUtc, getNewId) => {
    _persistence = persistence;
    _rest = rest;
    _getNowUtc = getNowUtc;
    _getNewId = getNewId;
}

let initializing = false;
let currentSession = null;

/**
 * Initializes new session.
 * @param accountId your account id
 * @param appId is your application id
 * @param version the application version (e.g. '1.2.3')
 * @param isRelease separates debug sessions from release (i.e. production) sessions (true of false).
 */
export const initialize = async (accountId, appId, version, isRelease) => {
    if (initializing) {
        console.warn('Journey3: Already initializing');
        return;
    }

    try {
        initializing = true;
        if (!currentSession) {
            return await initializeInternal(accountId, appId, version, isRelease);
        }
    } finally {
        initializing = false;
    }
}

export const initializeInternal = async (accountId, appId, version, isRelease) => {
    if (!accountId) {
        throw Error('accountId is mandatory');
    }
    if (!appId) {
        throw Error('appId is mandatory');
    }

    if (!version) {
        version = '';
    }
    if (!isRelease) {
        isRelease = false;
    }

    try {
        // start new session
        const header = createSessionHeader(
            accountId, appId, version, isRelease, _getNowUtc, _getNewId);
        currentSession = createSession(
            header.id, accountId, appId, version, isRelease, header.start, _getNowUtc);
        console.info(`Journey3: Started new session ${currentSession.id}`);

        // report previous session
        const session = await _persistence.loadLastSession(_getNowUtc, _getNewId);
        if (session != null) {
            console.info('Journey3: Report the end of the previous session');
            try {
                await _rest.postSession(session);
            } catch (err) {
                console.warn(`Journey3: Failed to report the end of the previous session: ${err}`);
            }
        }

        // update current session based on the previous one
        if (session == null) {
            header.fst_launch = true;
            currentSession.fst_launch = true;

            header.fst_launch_hour = true;
            header.fst_launch_day = true;
            header.fst_launch_month = true;
            header.fst_launch_year = true;
            header.fst_launch_version = true;
        } else {
            const today = _getNowUtc();
            const lastSessionStart = session.start;

            if (!isSameHour(lastSessionStart, today)) {
                header.fst_launch_hour = true;
            }
            if (!isSameDay(lastSessionStart, today)) {
                header.fst_launch_day = true;
            }
            if (!isSameMonth(lastSessionStart, today)) {
                header.fst_launch_month = true;
            }
            if (!isSameYear(lastSessionStart, today)) {
                header.fst_launch_year = true;
            }
            if (session.version !== version) {
                header.fst_launch_version = true;
            }

            currentSession.prev_stage = session.new_stage;
            currentSession.new_stage = session.new_stage;
            header.prev_stage = session.new_stage;

            header.since = session.since;
            currentSession.since = session.since;
        }

        // save current session
        await _persistence.saveSession(currentSession);

        // report the new session (header)
        console.info('Journey3: Report the start of a new session');
        await _rest.postSessionHeader(header);
    } catch (err) {
        console.warn(`Journey3: Failed to initialize Journey: ${err}`);
    }
};

/**
 * Registers the event in the current session.
 * @param eventName event name
 * @param isCollapsible whether event is collapsible
 * 
 * Events are distinguished by eventName, for example 'click_play',
 * 'add_to_library' or 'use_search'.
 * Short and clear names are recommended.
 * 
 * Do not include any personal data as an event name!
 * 
 * Specify whether event isCollapsible.
 * Collapsible events will only appear in the sequence once.
 * Make events collapsible when number of times it is repeated is not important.
 * For example, if your application is music play app, where the users
 * normally browse through the list of albums before clicking 'play',
 * 'scroll_to_next_album' event would probably be a good candidate to be
 * made collapsible, while 'click_play' event would probably not.
 * 
 * Collapsible event names appear in brackets in the sequence,
 * for example '(scroll_to_next_album)'.
 */
export const reportEvent = async (eventName, isCollapsible) => {
    reportEventInternal(eventName, isCollapsible);
}

/**
 * Registers the error event in the current session.
 * @param eventName event name
 * 
 * Errors are just special types of events.
 * Events are distinguished by eventName, for example 'error_fetching_data' 
 * or 'error_playing_song'.
 * Short and clear names are recommended.
 * 
 * Do not include any personal data as an event name!
 */
export const reportError = async (eventName) => {
    reportEventInternal(eventName, false, true);
}

/**
 * Registers the crash event in the current session.
 * @param eventName event name
 * 
 * Crashes are just special types of events.
 * Events are distinguished by eventName, you can simply specify 'crash' for a crash event.
 * Short and clear names are recommended.
 * 
 * Do not include any personal data as an event name!
 */
export const reportCrash = async (eventName) => {
    reportEventInternal(eventName, false, true, true);
}

const reportEventInternal = async (eventName, isCollapsible, isError, isCrash) => {
    if (!eventName) {
        throw Error('eventName is mandatory');
    }
    if (!isCollapsible) {
        isCollapsible = false;
    }
    if (!isError) {
        isError = false;
    }
    if (!isCrash) {
        isCrash = false;
    }

    if (!currentSession) {
        console.warn(
            'Journey3: Cannot update session. Journey have not been initialized.');
        return;
    }

    try {
        // count events
        currentSession.evts[eventName] =
            (currentSession.evts[eventName] || 0) + 1;

        // set error
        if (isError) {
            currentSession.has_error = true;
        }
        if (isCrash) {
            currentSession.has_crash = true;
        }

        // sequence events
        var seq = currentSession.evt_seq;
        if (seq.length < MAX_SEQ_LENGTH) {
            var seqEventName = isCollapsible ? `(${eventName})` : eventName;
            if (!(seq.length > 0 && seq[seq.length - 1] === seqEventName && isCollapsible)) {
                seq.push(seqEventName);
            } else {
                // ignore the event for the sequence
            }
        }

        // update endtime
        currentSession.end = _getNowUtc();

        // save session
        await _persistence.saveSession(currentSession);
    } catch (err) {
        console.warn(`Journey3: Cannot update session: ${err}`);
    }
}

/**
 * Reports the stage transition, e.g. 'engagement', 'checkout', 'payment'.
 * Stage transitions are used to build funnels.
 * @param stage an ordinal number [1..10] that defines the stage.
 * Stage transitions must be increasing. If the current session is already
 * at the higher stage, the call will be ignored.
 * This means you don't need to keep track of a current stage.
 * @param stageName provides the stage name for informational purposes.
 * 
 * It is recommended to define stages upfront as the numbers used to build
 * conversion funnel.
 * If you sumbit the new name for the same stage, that new name will be used
 * in all future reports.
 */
export const reportStageTransition = async (stage, stageName) => {
    stage = parseInt(stage);
    if (!stage) {
        throw Error('stage is mandatory, should be an integer');
    }
    if (!stageName) {
        stageName = '';
    }

    if (!currentSession) {
        console.warn(
            'Journey3: Cannot update session. Journey have not been initialized.');
        return;
    }

    if (stage < 1 || stage > 10) {
        throw Error(
            `Invalid value ${stage} for stage, must be between 1 and 10`);
    }

    try {
        if (currentSession.new_stage.stage < stage) {
            currentSession.new_stage = createStage(stage, stageName, _getNowUtc);
        }

        // update endtime
        currentSession.end = _getNowUtc();

        // save session
        await _persistence.saveSession(currentSession);
    } catch (err) {
        console.warn(`Journey3: Cannot update session: ${err}`);
        throw err;
    }
}

/**
 * Flushed the events in the current session.
 * Use this method to report events before the session is properly terminated.
 * 
 * Flushing events introduces extra network trafic, so use it with caution.
 * Do not flush session every time you report an event, the users won't be happy.
 * 
 * Consider flushing the session after first 30 seconds of using the app or upon the app exit.
 * This might help tracking events coming from users who use the app once 
 * and then immediately uninstall it, since the full session is reported only when 
 * the user restarts the app.
 */
export const flushEvents = async () => {
    if (!currentSession) {
        console.warn(
            'Journey3: Cannot flush session. Journey have not been initialized.');
        return;
    }

    try {
        // prepare flush
        const flush = createSessionFlush(
            currentSession.id,
            currentSession.acc,
            currentSession.aid,
            currentSession.version,
            currentSession.is_release,
            currentSession.start);
        flush.fst_launch = currentSession.fst_launch;
        flush.evts = currentSession.evts;
        flush.flushed = currentSession.flushed;

        // send session flush
        console.info('Journey3: Flush the current session');
        await _rest.postSessionFlush(flush);

        // copy evts as flushed
        const flushed = {};
        for (let evt in currentSession.evts) {
            flushed[evt] = currentSession.evts[evt];
        }
        currentSession.flushed = flushed;

        // update endtime
        currentSession.end = _getNowUtc();

        // save session
        await _persistence.saveSession(currentSession);
    } catch (err) {
        console.warn(`Journey3: Cannot flush session: ${err}`);
    }
}