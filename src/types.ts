/** Calendar date in local time, formatted YYYY-MM-DD. Sorts and compares as a string. */
export type DateKey = string;

export type HabitKind = 'check' | 'count' | 'duration';

export type Schedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] } // 0 = Sun … 6 = Sat
  | { type: 'weekly'; timesPerWeek: number };

export interface Habit {
  id: string;
  name: string;
  kind: HabitKind;
  /** Goal per day (or per session for weekly habits). 1 for check habits, minutes for duration. */
  target: number;
  unit?: string;
  color: string;
  schedule: Schedule;
  /** First day the habit counts toward scores. */
  startDate: DateKey;
  /** Day the habit was archived; it stops counting from this day on. */
  archivedAt?: DateKey;
  order: number;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  habitId: string;
  /** The day this entry counts toward (may be in the past when backfilling). */
  date: DateKey;
  amount: number;
  note?: string;
  loggedAt: string;
}

export type Period = 'week' | 'month';

export interface Reflection {
  /** "week:2026-10-12" or "month:2026-10" */
  id: string;
  period: Period;
  start: DateKey;
  text: string;
  /** Set when the recap has been shown, so it auto-opens only once. */
  seenAt?: string;
}

export interface AppData {
  version: 1;
  habits: Habit[];
  logs: LogEntry[];
  reflections: Record<string, Reflection>;
}
