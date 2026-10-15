import { describe, expect, it } from 'vitest';
import { dayScore, habitProgress, indexLogs, isScheduled, streak, weeklyProgress } from './progress';
import { habit, log } from './testUtils';

describe('habitProgress', () => {
  it('gives partial credit for counts and caps at 100%', () => {
    const water = habit({ kind: 'count', target: 8 });
    expect(habitProgress(water, '2026-10-05', indexLogs([log(water, '2026-10-05', 5)]))).toBeCloseTo(0.625);
    expect(habitProgress(water, '2026-10-05', indexLogs([log(water, '2026-10-05', 12)]))).toBe(1);
  });

  it('sums multiple duration entries in a day', () => {
    const read = habit({ kind: 'duration', target: 30 });
    const idx = indexLogs([log(read, '2026-10-05', 10), log(read, '2026-10-05', 5)]);
    expect(habitProgress(read, '2026-10-05', idx)).toBeCloseTo(0.5);
  });

  it('treats check habits as all-or-nothing', () => {
    const bed = habit({});
    expect(habitProgress(bed, '2026-10-05', indexLogs([]))).toBe(0);
    expect(habitProgress(bed, '2026-10-05', indexLogs([log(bed, '2026-10-05')]))).toBe(1);
  });

  it('uses the current target for past days (retroactive edits)', () => {
    const water = habit({ kind: 'count', target: 6 });
    const idx = indexLogs([log(water, '2026-10-05', 6)]);
    expect(habitProgress(water, '2026-10-05', idx)).toBe(1);
    expect(habitProgress({ ...water, target: 8 }, '2026-10-05', idx)).toBeCloseTo(0.75);
  });
});

describe('isScheduled', () => {
  it('respects weekdays, start date and archive date', () => {
    // 2026-10-05 is a Monday, 2026-10-06 a Tuesday.
    const gym = habit({ schedule: { type: 'weekdays', days: [1, 3, 5] }, startDate: '2026-10-02', archivedAt: '2026-10-20' });
    expect(isScheduled(gym, '2026-10-05')).toBe(true);
    expect(isScheduled(gym, '2026-10-06')).toBe(false);
    expect(isScheduled(gym, '2026-09-28')).toBe(false); // before start
    expect(isScheduled(gym, '2026-10-26')).toBe(false); // archived
  });
});

describe('dayScore', () => {
  it('is the equal-weight mean of due habits, excluding weekly quotas', () => {
    const a = habit({});
    const b = habit({ kind: 'count', target: 4 });
    const weekly = habit({ schedule: { type: 'weekly', timesPerWeek: 3 } });
    const idx = indexLogs([log(a, '2026-10-05'), log(b, '2026-10-05', 2)]);
    expect(dayScore('2026-10-05', [a, b, weekly], idx)).toBeCloseTo(0.75);
  });

  it('is null when nothing is due', () => {
    const gym = habit({ schedule: { type: 'weekdays', days: [1] } });
    expect(dayScore('2026-10-06', [gym], indexLogs([]))).toBeNull();
  });
});

describe('weeklyProgress', () => {
  it('counts sessions toward the quota', () => {
    const gym = habit({ schedule: { type: 'weekly', timesPerWeek: 3 } });
    const idx = indexLogs([log(gym, '2026-10-05'), log(gym, '2026-10-07'), log(gym, '2026-10-12')]);
    const w = weeklyProgress(gym, '2026-10-05', idx);
    expect(w.done).toBe(2);
    expect(w.pct).toBeCloseTo(2 / 3);
  });
});

describe('streak', () => {
  it('skips unscheduled days and does not break on an unfinished today', () => {
    // Mon/Wed/Fri habit; Mon 5, Wed 7, Fri 9, Mon 12 done; today is Wed 14 and not done yet.
    const h = habit({ schedule: { type: 'weekdays', days: [1, 3, 5] }, startDate: '2026-10-05' });
    const idx = indexLogs(['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12'].map((d) => log(h, d)));
    expect(streak(h, idx, '2026-10-14')).toEqual({ current: 4, best: 4, unit: 'day' });
  });

  it('resets after a missed scheduled day', () => {
    const h = habit({ startDate: '2026-10-01' });
    const idx = indexLogs(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05'].map((d) => log(h, d)));
    expect(streak(h, idx, '2026-10-05')).toEqual({ current: 1, best: 3, unit: 'day' });
  });

  it('counts weeks for weekly quotas', () => {
    const h = habit({ schedule: { type: 'weekly', timesPerWeek: 2 }, startDate: '2026-09-28' });
    const idx = indexLogs(
      ['2026-09-28', '2026-09-30', '2026-10-05', '2026-10-06', '2026-10-12'].map((d) => log(h, d)),
    );
    // Weeks of Sep 28 and Oct 5 met; week of Oct 12 is in progress.
    expect(streak(h, idx, '2026-10-14')).toEqual({ current: 2, best: 2, unit: 'week' });
  });
});
