import {
    isSameYear,
    isSameMonth,
    isSameDay,
    isSameHour,
} from '../src/dateutil';

test('same year not same month', () => {
    const date1 = new Date('2020-01-01T00:00:00.000Z');
    const date2 = new Date('2020-02-03T01:02:03.000Z');

    expect(isSameYear(date1, date2)).toBeTruthy();
    expect(isSameMonth(date1, date2)).toBeFalsy();
});

test('same month not same day', () => {
    const date1 = new Date('2020-01-01T00:00:00.000Z');
    const date2 = new Date('2020-01-03T01:02:03.000Z');

    expect(isSameMonth(date1, date2)).toBeTruthy();
    expect(isSameDay(date1, date2)).toBeFalsy();
});

test('same day not same hour', () => {
    const date1 = new Date('2020-01-01T00:00:00.000Z');
    const date2 = new Date('2020-01-01T01:02:03.000Z');

    expect(isSameDay(date1, date2)).toBeTruthy();
    expect(isSameHour(date1, date2)).toBeFalsy();
});

test('same hour', () => {
    const date1 = new Date('2020-01-01T00:00:00.000Z');
    const date2 = new Date('2020-01-01T00:02:03.000Z');

    expect(isSameHour(date1, date2)).toBeTruthy();
});