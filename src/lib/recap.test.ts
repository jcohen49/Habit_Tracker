import { describe, expect, it } from 'vitest';
import { habit, log } from './testUtils';
import { indexLogs } from './progress';
import { buildRecap, listPeriods, pendingRecaps, periodId, periodLabel } from './recap';

describe('buildRecap', () => {
  const read = habit({ name: 'Read', kind: 'duration', target: 30, startDate: '2026-09-28' });
  const bed = habit({ name: 'Bed', startDate: '2026-09-28' });
  const logs = [
    // Previous week (Sep 28 – Oct 4): read 30 min every day, bed never.
    ...['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d) =>
      log(read, d, 30),
    ),
    // This week (Oct 5 – 11): read 15 min daily, bed every day, one note.
    ...['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'].flatMap((d) => [
      log(read, d, 15),
      log(bed, d),
    ]),
    log(read, '2026-10-08', 15, 'Finished the book'),
  ];
  const idx = indexLogs(logs);
  const r = buildRecap('week', '2026-10-05', [read, bed], logs, idx, '2026-10-15');

  it('sorts habits best to worst with deltas vs last period', () => {
    expect(r.habits.map((h) => h.habit.name)).toEqual(['Bed', 'Read']);
    const readRecap = r.habits.find((h) => h.habit.name === 'Read')!;
    expect(readRecap.pct).toBeCloseTo((6 * 0.5 + 1) / 7);
    expect(readRecap.prevPct).toBe(1);
    expect(readRecap.delta).toBeLessThan(0);
    expect(r.habits[0].delta).toBe(1);
  });

  it('computes totals, highlights and notes', () => {
    expect(r.habits.find((h) => h.habit.name === 'Read')!.total).toBe(7 * 15 + 15);
    expect(r.habits.find((h) => h.habit.name === 'Bed')!.total).toBe(7);
    expect(r.perfectDays).toBe(1);
    expect(r.bestDay).toEqual({ date: '2026-10-08', score: 1 });
    expect(r.longestStreak?.habit.name).toBe('Bed');
    expect(r.longestStreak?.length).toBe(7);
    expect(r.notes.map((n) => n.note)).toEqual(['Finished the book']);
    expect(r.inProgress).toBe(false);
  });

  it('marks the current period in progress and only counts days so far', () => {
    const cur = buildRecap('week', '2026-10-12', [read, bed], logs, idx, '2026-10-13');
    expect(cur.inProgress).toBe(true);
    expect(cur.scoredDays).toBe(2);
  });
});

describe('pendingRecaps', () => {
  it('offers last week and last month when unseen', () => {
    const h = habit({ startDate: '2026-09-01' });
    expect(pendingRecaps('2026-10-15', [h], {})).toEqual([
      { period: 'week', start: '2026-10-05' },
      { period: 'month', start: '2026-09-01' },
    ]);
  });

  it('skips seen recaps and periods before the first habit', () => {
    const h = habit({ startDate: '2026-10-07' });
    const seen = { [periodId('week', '2026-10-05')]: { id: 'week:2026-10-05', period: 'week' as const, start: '2026-10-05', text: '', seenAt: 'x' } };
    expect(pendingRecaps('2026-10-15', [h], seen)).toEqual([]);
    const brandNew = habit({ startDate: '2026-10-15' });
    expect(pendingRecaps('2026-10-15', [brandNew], {})).toEqual([]);
  });
});

describe('periods', () => {
  it('lists periods newest first back to the first habit', () => {
    const h = habit({ startDate: '2026-09-20' });
    expect(listPeriods('month', [h], '2026-10-15')).toEqual(['2026-10-01', '2026-09-01']);
    expect(listPeriods('week', [h], '2026-10-15')).toEqual(['2026-10-12', '2026-10-05', '2026-09-28', '2026-09-21', '2026-09-14']);
  });

  it('labels periods', () => {
    expect(periodLabel('week', '2026-10-12')).toBe('Oct 12 – 18, 2026');
    expect(periodLabel('week', '2026-09-28')).toBe('Sep 28 – Oct 4, 2026');
    expect(periodLabel('month', '2026-10-01')).toBe('October 2026');
  });
});
