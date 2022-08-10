import {
    createStage,
    createStageFromJson,
    createSession,
    createSessionFromJson,
    createStageNewUser
} from '../src/domain.js';

const DATE_1 = '2020-01-01T00:00:00.000Z';
const DATE_2 = '2020-02-01T00:00:00.000Z';

const ID_1 = 'id001';
const ID_2 = 'id002';

test('stage to json roundtrip', () => {
    const stage = createStage(3, 'stage3', () => new Date(DATE_1));
    const json = JSON.stringify(stage);
    const actual = createStageFromJson(json, () => new Date(DATE_2));

    const expected = {
        ts: new Date(DATE_1),
        stage: 3,
        name: 'stage3'
    };
    expect(actual).toStrictEqual(expected);
});

test('stage from empty json', () => {
    const actual = createStageFromJson('{}', () => new Date(DATE_1));

    const expected = {
        ts: new Date(DATE_1),
        stage: 1,
        name: 'new_user'
    };
    expect(actual).toStrictEqual(expected);
});

test('session to json roundtrip', () => {
    const session = createSession(
        ID_1,
        'accid',
        'appid',
        '1.0',
        false,
        DATE_1,
        () => new Date(DATE_1),
    );
    const json = JSON.stringify(session);
    const actual = createSessionFromJson(json, () => new Date(DATE_2), () => ID_2);

    const expected = {
        t: 'stail',
        v: '1.1.0',
        id: ID_1,
        since: new Date(DATE_1),
        start: new Date(DATE_1),
        end: new Date(DATE_1),
        acc: 'accid',
        aid: 'appid',
        version: '1.0',
        is_release: false,
        fst_launch: false,
        has_error: false,
        has_crash: false,
        evts: {},
        evt_seq: [],
        prev_stage: createStageNewUser(() => new Date(DATE_1)),
        new_stage: createStageNewUser(() => new Date(DATE_1)),
    };
    expect(actual).toStrictEqual(expected);
});

test('session from empty json', () => {
    const actual = createSessionFromJson('{}', () => new Date(DATE_1), () => ID_1);

    const expected = {
        t: 'stail',
        v: '1.1.0',
        id: ID_1,
        since: new Date(DATE_1),
        start: new Date(DATE_1),
        end: new Date(DATE_1),
        acc: '',
        aid: '',
        version: '',
        is_release: false,
        fst_launch: false,
        has_error: false,
        has_crash: false,
        evts: {},
        evt_seq: [],
        prev_stage: createStageNewUser(() => new Date(DATE_1)),
        new_stage: createStageNewUser(() => new Date(DATE_1)),
    };
    expect(actual).toStrictEqual(expected);
});