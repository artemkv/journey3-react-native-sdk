import {
    config,
    initializeInternal,
    reportEvent,
    reportError,
    reportCrash,
    reportStageTransition
} from '../src/journey.js';
import {
    createStage,
    createSessionHeader,
    createSession,
} from '../src/domain.js';

const mock = f => {
    let _invocations = 0;
    let _params = [];

    const mocked = (...params) => {
        _invocations++;
        _params = params;
        return f(...params);
    };

    mocked._getInvocations = () => _invocations;
    mocked._getLastCapturedParams = () => _params;

    return mocked;
}

const PREV_SESSION_ID = 'SESSION0';
const SESSION_ID = 'SESSION1';
const ACCOUNT_ID = 'accid';
const APP_ID = 'appid';
const PREV_VERSION = '1.0';
const VERSION = '2.0';
const RELEASE_BUILD = true;
const CLICK_PLAY = 'click_play';
const CLICK_PAUSE = 'click_pause';
const NAVIGATE = 'navigate';
const ERROR = 'error';
const CRASH = 'crash';
const LAST_YEAR = new Date('2021-01-01T00:00:00.000Z');
const NOW = new Date('2022-01-01T00:00:00.000Z');
const LATER = new Date('2023-01-01T00:00:00.000Z');

const setup = (
    loadLastSessionMock,
    saveSessionMock,
    postSessionHeader,
    postSession,
    getNowUtc,
    getNewId) => {
    config(
        {
            loadLastSession: loadLastSessionMock,
            saveSession: saveSessionMock,
        },
        {
            postSessionHeader: postSessionHeader,
            postSession: postSession,
        },
        getNowUtc,
        getNewId
    );
}

test('report the very first session', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);

    // Act
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expect(saveSessionMock._getInvocations()).toStrictEqual(1);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);

    const expectedHeader = createSessionHeader(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, () => NOW, () => SESSION_ID);
    expectedHeader.fst_launch = true;
    expectedHeader.fst_launch_hour = true;
    expectedHeader.fst_launch_day = true;
    expectedHeader.fst_launch_month = true;
    expectedHeader.fst_launch_year = true;
    expectedHeader.fst_launch_version = true;
    expect(postSessionHeader._getInvocations()).toStrictEqual(1);
    expect(postSessionHeader._getLastCapturedParams()[0]).toStrictEqual(expectedHeader);
});

test('restore and report previous session', async () => {
    // Setup
    const prevSession = createSession(PREV_SESSION_ID, ACCOUNT_ID, APP_ID, PREV_VERSION, RELEASE_BUILD, LAST_YEAR, () => LAST_YEAR);
    const stage2 = createStage(2, 'Stage 2', () => LAST_YEAR);
    const stage3 = createStage(3, 'Stage 3', () => LAST_YEAR);
    prevSession.prev_stage = stage2;
    prevSession.new_stage = stage3;

    const loadLastSessionMock = mock(() => prevSession);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);

    // Act
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Verify
    expect(loadLastSessionMock._getInvocations()).toStrictEqual(1);

    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.prev_stage = stage3;
    expectedSession.new_stage = stage3;
    expectedSession.since = LAST_YEAR;
    expect(saveSessionMock._getInvocations()).toStrictEqual(1);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);

    const expectedHeader = createSessionHeader(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, () => NOW, () => SESSION_ID);
    expectedHeader.fst_launch_hour = true;
    expectedHeader.fst_launch_day = true;
    expectedHeader.fst_launch_month = true;
    expectedHeader.fst_launch_year = true;
    expectedHeader.fst_launch_version = true;
    expectedHeader.prev_stage = stage3;
    expectedHeader.since = LAST_YEAR;
    expect(postSessionHeader._getInvocations()).toStrictEqual(1);
    expect(postSessionHeader._getLastCapturedParams()[0]).toStrictEqual(expectedHeader);
});

test('report an event', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportEvent(CLICK_PLAY);
    reportEvent(CLICK_PAUSE);
    reportEvent(CLICK_PLAY);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.evts[CLICK_PLAY] = 2;
    expectedSession.evts[CLICK_PAUSE] = 1;
    expectedSession.evt_seq = [CLICK_PLAY, CLICK_PAUSE, CLICK_PLAY];
    expect(saveSessionMock._getInvocations()).toStrictEqual(4);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('report a collapsible event', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportEvent(NAVIGATE, true);
    reportEvent(NAVIGATE, true);
    reportEvent(NAVIGATE, true);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.evts[NAVIGATE] = 3;
    expectedSession.evt_seq = [`(${NAVIGATE})`];
    expect(saveSessionMock._getInvocations()).toStrictEqual(4);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('report error', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportError(ERROR);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.evts[ERROR] = 1;
    expectedSession.evt_seq = [ERROR];
    expectedSession.has_error = true;
    expect(saveSessionMock._getInvocations()).toStrictEqual(2);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('report crash', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportCrash(CRASH);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.evts[CRASH] = 1;
    expectedSession.evt_seq = [CRASH];
    expectedSession.has_error = true;
    expectedSession.has_crash = true;
    expect(saveSessionMock._getInvocations()).toStrictEqual(2);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('reporting an event udpates end time', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => LATER,
        () => SESSION_ID);
    reportEvent(CLICK_PLAY);

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.evts[CLICK_PLAY] = 1;
    expectedSession.evt_seq = [CLICK_PLAY];
    expectedSession.end = LATER;
    expect(saveSessionMock._getInvocations()).toStrictEqual(2);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('report stage transition', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportStageTransition(2, 'new_stage');

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.new_stage = createStage(2, 'new_stage', () => NOW);
    expect(saveSessionMock._getInvocations()).toStrictEqual(2);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});

test('report stage transition ignored when new stage is lower', async () => {
    // Setup
    const loadLastSessionMock = mock(() => null);
    const saveSessionMock = mock((_) => { });
    const postSessionHeader = mock((_) => { });
    const postSession = mock((_) => { });
    setup(
        loadLastSessionMock,
        saveSessionMock,
        postSessionHeader,
        postSession,
        () => NOW,
        () => SESSION_ID);
    await initializeInternal(ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD);

    // Act
    reportStageTransition(3, 'stage3');
    reportStageTransition(2, 'stage2');

    // Verify
    const expectedSession = createSession(SESSION_ID, ACCOUNT_ID, APP_ID, VERSION, RELEASE_BUILD, NOW, () => NOW);
    expectedSession.fst_launch = true;
    expectedSession.new_stage = createStage(3, 'stage3', () => NOW);
    expect(saveSessionMock._getInvocations()).toStrictEqual(3);
    expect(saveSessionMock._getLastCapturedParams()[0]).toStrictEqual(expectedSession);
});