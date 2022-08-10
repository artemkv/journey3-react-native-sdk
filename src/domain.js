export const createSessionHeader = (
    accountId,
    appId,
    version,
    isRelease,
    getNowUtc,
    getNewId) => {
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

    return {
        t: 'shead',
        v: '1.1.0',

        id: getNewId(),
        acc: accountId,
        aid: appId,
        version: version,
        is_release: isRelease,

        since: getNowUtc(),
        start: getNowUtc(),

        fst_launch: false,
        fst_launch_hour: false,
        fst_launch_day: false,
        fst_launch_month: false,
        fst_launch_year: false,
        fst_launch_version: false,

        prev_stage: createStageNewUser(getNowUtc)
    };
};

export const createSession = (
    id,
    accountId,
    appId,
    version,
    isRelease,
    start,
    getNowUtc) => {
    if (!id) {
        throw Error('id is mandatory');
    }
    if (!accountId) {
        throw Error('accountId is mandatory');
    }
    if (!appId) {
        throw Error('appId is mandatory');
    }
    if (!start) {
        throw Error('start is mandatory');
    }

    if (!version) {
        version = '';
    }
    if (!isRelease) {
        isRelease = false;
    }

    return {
        t: 'stail',
        v: '1.1.0',

        id: id,
        acc: accountId,
        aid: appId,
        version: version,
        is_release: isRelease,

        start: start,
        end: start,
        since: start,

        fst_launch: false,

        prev_stage: createStageNewUser(getNowUtc),
        new_stage: createStageNewUser(getNowUtc),

        has_error: false,
        has_crash: false,

        evts: {},
        evt_seq: [],
    };
};

export const createSessionFromJson = (json, getNowUtc, getNewId) => {
    const obj = JSON.parse(json);

    return {
        t: 'stail',
        v: '1.1.0',
        id: obj.id || getNewId(),
        since: obj.since ? new Date(obj.since) : getNowUtc(),
        start: obj.start ? new Date(obj.start) : getNowUtc(),
        end: obj.end ? new Date(obj.end) : getNowUtc(),
        acc: obj.acc ?? '',
        aid: obj.aid ?? '',
        version: obj.version ?? '',
        is_release: obj.is_release ?? false,
        fst_launch: obj.fst_launch ?? false,
        has_error: obj.has_error ?? false,
        has_crash: obj.has_crash ?? false,
        evts: obj.evts ?? {},
        evt_seq: obj.evt_seq ?? [],
        prev_stage: obj.prev_stage ? createStageFromObject(obj.prev_stage, getNowUtc) : createStageNewUser(getNowUtc),
        new_stage: obj.new_stage ? createStageFromObject(obj.new_stage, getNowUtc) : createStageNewUser(getNowUtc),
    }
};

export const createStage = (stage, name, getNowUtc) => {
    return {
        ts: getNowUtc(),
        stage: stage,
        name: name
    };
};

export const createStageNewUser = (getNowUtc) => {
    return createStage(1, 'new_user', getNowUtc);
};

export const createStageFromJson = (json, getNowUtc) => {
    const obj = JSON.parse(json);
    return createStageFromObject(obj, getNowUtc);
};

const createStageFromObject = (obj, getNowUtc) => {
    return {
        ts: obj.ts ? new Date(obj.ts) : getNowUtc(),
        stage: obj.stage ?? 1,
        name: obj.name ?? 'new_user',
    }
};