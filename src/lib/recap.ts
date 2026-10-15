import type { DateKey, Habit, LogEntry, Period, Reflection } from '../types';
import {
  addDaysKey,
  daysBetween,
  formatKey,
  minKey,
  monthEndKey,
  monthStartKey,
  prevMonthStartKey,
  weekStartKey,
} from './dates';
import {
  dayAmount,
  dayScore,
  habitProgress,
  isActive,
  isScheduled,
  isWeeklyQuota,
  runs,
  type LogIndex,
} from './progress';

export const periodStart = (period: Period, date: DateKey): DateKey =>
  period === 'week' ? weekStartKey(date) : monthStartKey(date);

export const periodEnd = (period: Period, start: DateKey): DateKey =>
  period === 'week' ? addDaysKey(start, 6) : monthEndKey(start);

export const prevPeriodStart = (period: Period, start: DateKey): DateKey =>
  period === 'week' ? addDaysKey(start, -7) : prevMonthStartKey(start);

export const periodId = (period: Period, start: DateKey): string =>
  `${period}:${period === 'week' ? start : start.slice(0, 7)}`;

export function periodLabel(period: Period, start: DateKey): string {
  if (period === 'month') return formatKey(start, 'MMMM yyyy');
  const end = periodEnd(period, start);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${formatKey(start, 'MMM d')} – ${formatKey(end, sameMonth ? 'd, yyyy' : 'MMM d, yyyy')}`;
}

export interface HabitRecap {
  habit: Habit;
  pct: number;
  prevPct: number | null;
  delta: number | null;
  total: number;
  bestRun: number;
}

export interface RecapData {
  period: Period;
  start: DateKey;
  end: DateKey;
  inProgress: boolean;
  overall: number | null;
  prevOverall: number | null;
  delta: number | null;
  habits: HabitRecap[];
  bestDay: { date: DateKey; score: number } | null;
  perfectDays: number;
  scoredDays: number;
  longestStreak: { habit: Habit; length: number } | null;
  notes: { id: string; date: DateKey; habit: Habit; note: string; amount: number }[];
}

/**
 * A habit's % for a stretch of days, or null if it wasn't due at all.
 * `days` may be clipped at today; `fullDays` is the whole period (used to size weekly quotas).
 */
function habitPeriodPct(habit: Habit, days: DateKey[], fullDays: DateKey[], idx: LogIndex): number | null {
  if (habit.schedule.type === 'weekly') {
    const activeDays = fullDays.filter((d) => isActive(habit, d)).length;
    if (activeDays === 0) return null;
    const expected = (habit.schedule.timesPerWeek * activeDays) / 7;
    const done = days.filter((d) => isActive(habit, d)).reduce((s, d) => s + habitProgress(habit, d, idx), 0);
    return expected > 0 ? Math.min(1, done / expected) : null;
  }
  const due = days.filter((d) => isScheduled(habit, d));
  if (due.length === 0) return null;
  return due.reduce((s, d) => s + habitProgress(habit, d, idx), 0) / due.length;
}

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function periodHabitPcts(period: Period, start: DateKey, habits: Habit[], idx: LogIndex, today: DateKey) {
  const end = periodEnd(period, start);
  const fullDays = daysBetween(start, end);
  const days = daysBetween(start, minKey(end, today));
  const pcts = new Map<string, number>();
  for (const h of habits) {
    const p = habitPeriodPct(h, days, fullDays, idx);
    if (p !== null) pcts.set(h.id, p);
  }
  return { days, pcts };
}

/** Stats for one week or month. Overall = equal-weight mean of each habit's % for the period. */
export function buildRecap(
  period: Period,
  start: DateKey,
  habits: Habit[],
  logs: LogEntry[],
  idx: LogIndex,
  today: DateKey,
): RecapData {
  const end = periodEnd(period, start);
  const { days, pcts } = periodHabitPcts(period, start, habits, idx, today);
  const prev = periodHabitPcts(period, prevPeriodStart(period, start), habits, idx, today);

  const habitRecaps: HabitRecap[] = habits
    .filter((h) => pcts.has(h.id))
    .map((h) => {
      const pct = pcts.get(h.id)!;
      const prevPct = prev.pcts.get(h.id) ?? null;
      const flags = isWeeklyQuota(h)
        ? []
        : days.filter((d) => isScheduled(h, d)).map((d) => habitProgress(h, d, idx) >= 1);
      const total = days.reduce((s, d) => {
        const amount = dayAmount(idx, h.id, d);
        return s + (h.kind === 'check' ? (amount > 0 ? 1 : 0) : amount);
      }, 0);
      return { habit: h, pct, prevPct, delta: prevPct === null ? null : pct - prevPct, total, bestRun: runs(flags, false).best };
    })
    .sort((a, b) => b.pct - a.pct || a.habit.order - b.habit.order);

  const overall = mean(habitRecaps.map((r) => r.pct));
  const prevOverall = mean([...prev.pcts.values()]);

  let bestDay: RecapData['bestDay'] = null;
  let perfectDays = 0;
  let scoredDays = 0;
  for (const d of days) {
    const s = dayScore(d, habits, idx);
    if (s === null) continue;
    scoredDays++;
    if (s >= 1) perfectDays++;
    if (!bestDay || s >= bestDay.score) bestDay = { date: d, score: s };
  }

  let longestStreak: RecapData['longestStreak'] = null;
  for (const r of habitRecaps) {
    if (r.bestRun > 0 && (!longestStreak || r.bestRun > longestStreak.length)) {
      longestStreak = { habit: r.habit, length: r.bestRun };
    }
  }

  const byId = new Map(habits.map((h) => [h.id, h]));
  const last = days[days.length - 1] ?? '';
  const notes = logs
    .filter((l) => l.date >= start && l.date <= last && l.note?.trim() && byId.has(l.habitId))
    .sort((a, b) => a.date.localeCompare(b.date) || a.loggedAt.localeCompare(b.loggedAt))
    .map((l) => ({ id: l.id, date: l.date, habit: byId.get(l.habitId)!, note: l.note!.trim(), amount: l.amount }));

  return {
    period,
    start,
    end,
    inProgress: today <= end,
    overall,
    prevOverall,
    delta: overall !== null && prevOverall !== null ? overall - prevOverall : null,
    habits: habitRecaps,
    bestDay,
    perfectDays,
    scoredDays,
    longestStreak,
    notes,
  };
}

/** Earliest day any habit counts from, or null when there are no habits. */
export function firstTrackedDay(habits: Habit[]): DateKey | null {
  return habits.reduce<DateKey | null>((m, h) => (m === null || h.startDate < m ? h.startDate : m), null);
}

/**
 * The most recent finished week and month whose recap hasn't been shown yet.
 * Only the latest of each is offered so a long absence doesn't queue up a pile of pop-ups;
 * older ones are still in the Recaps tab.
 */
export function pendingRecaps(
  today: DateKey,
  habits: Habit[],
  reflections: Record<string, Reflection>,
): { period: Period; start: DateKey }[] {
  const first = firstTrackedDay(habits);
  if (!first) return [];
  const out: { period: Period; start: DateKey }[] = [];
  for (const period of ['week', 'month'] as const) {
    const start = prevPeriodStart(period, periodStart(period, today));
    if (periodEnd(period, start) < first) continue;
    if (reflections[periodId(period, start)]?.seenAt) continue;
    out.push({ period, start });
  }
  return out;
}

/** Period starts from the current one back to the first tracked one, newest first. */
export function listPeriods(period: Period, habits: Habit[], today: DateKey): DateKey[] {
  const first = firstTrackedDay(habits);
  if (!first) return [];
  const out: DateKey[] = [];
  for (let s = periodStart(period, today); periodEnd(period, s) >= first; s = prevPeriodStart(period, s)) {
    out.push(s);
  }
  return out;
}
