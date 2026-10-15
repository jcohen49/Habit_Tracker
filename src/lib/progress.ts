import type { DateKey, Habit, LogEntry } from '../types';
import { addDaysKey, dayOfWeek, daysBetween, minKey, weekStartKey } from './dates';

/** Sum of logged amounts keyed by `${habitId}|${date}`. */
export type LogIndex = Map<string, number>;

const key = (habitId: string, date: DateKey) => `${habitId}|${date}`;

export function indexLogs(logs: LogEntry[]): LogIndex {
  const idx: LogIndex = new Map();
  for (const l of logs) idx.set(key(l.habitId, l.date), (idx.get(key(l.habitId, l.date)) ?? 0) + l.amount);
  return idx;
}

export const dayAmount = (idx: LogIndex, habitId: string, date: DateKey): number =>
  idx.get(key(habitId, date)) ?? 0;

/** Whether the habit exists (started and not yet archived) on this day. */
export const isActive = (habit: Habit, date: DateKey): boolean =>
  date >= habit.startDate && (!habit.archivedAt || date < habit.archivedAt);

export const isWeeklyQuota = (habit: Habit): boolean => habit.schedule.type === 'weekly';

/** Whether a daily/weekday habit is due on this day. Weekly-quota habits are never "due" on a specific day. */
export function isScheduled(habit: Habit, date: DateKey): boolean {
  if (!isActive(habit, date)) return false;
  switch (habit.schedule.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return habit.schedule.days.includes(dayOfWeek(date));
    case 'weekly':
      return false;
  }
}

/** Fraction of the day's goal reached, 0..1. */
export function habitProgress(habit: Habit, date: DateKey, idx: LogIndex): number {
  const amount = dayAmount(idx, habit.id, date);
  if (habit.kind === 'check') return amount > 0 ? 1 : 0;
  if (habit.target <= 0) return amount > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, amount / habit.target));
}

/** Sessions done (partial sessions count fractionally) and % of the weekly quota. */
export function weeklyProgress(habit: Habit, weekStart: DateKey, idx: LogIndex) {
  const quota = habit.schedule.type === 'weekly' ? habit.schedule.timesPerWeek : 1;
  let done = 0;
  for (const d of daysBetween(weekStart, addDaysKey(weekStart, 6))) {
    if (isActive(habit, d)) done += habitProgress(habit, d, idx);
  }
  return { done, quota, pct: quota > 0 ? Math.min(1, done / quota) : 0 };
}

/** Equal-weight mean progress of daily/weekday habits due that day, or null if none are due. */
export function dayScore(date: DateKey, habits: Habit[], idx: LogIndex): number | null {
  const due = habits.filter((h) => isScheduled(h, date));
  if (due.length === 0) return null;
  return due.reduce((s, h) => s + habitProgress(h, date, idx), 0) / due.length;
}

/** Longest run of `true`, and the run ending at the last element. */
export function runs(flags: boolean[], lastInProgress: boolean) {
  let best = 0;
  let cur = 0;
  for (const f of flags) {
    cur = f ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  // An unfinished today (or this week) doesn't break the current streak yet.
  const tail = lastInProgress && flags.length && !flags[flags.length - 1] ? flags.slice(0, -1) : flags;
  let current = 0;
  for (let i = tail.length - 1; i >= 0 && tail[i]; i--) current++;
  return { current, best };
}

export interface StreakInfo {
  current: number;
  best: number;
  unit: 'day' | 'week';
}

/** Consecutive scheduled days (or weeks, for weekly quotas) at 100%. Unscheduled days are skipped. */
export function streak(habit: Habit, idx: LogIndex, today: DateKey): StreakInfo {
  const lastActive = habit.archivedAt ? minKey(today, addDaysKey(habit.archivedAt, -1)) : today;
  if (isWeeklyQuota(habit)) {
    const flags: boolean[] = [];
    let lastWeek = '';
    for (let w = weekStartKey(habit.startDate); w <= lastActive; w = addDaysKey(w, 7)) {
      flags.push(weeklyProgress(habit, w, idx).pct >= 1);
      lastWeek = w;
    }
    return { ...runs(flags, lastWeek === weekStartKey(today)), unit: 'week' };
  }
  const days = daysBetween(habit.startDate, lastActive).filter((d) => isScheduled(habit, d));
  const flags = days.map((d) => habitProgress(habit, d, idx) >= 1);
  return { ...runs(flags, days[days.length - 1] === today), unit: 'day' };
}
