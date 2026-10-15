import type { Habit, LogEntry } from '../types';

let n = 0;
export function habit(over: Partial<Habit>): Habit {
  return {
    id: `h${n++}`,
    name: 'Habit',
    kind: 'check',
    target: 1,
    color: '#3b82f6',
    schedule: { type: 'daily' },
    startDate: '2026-10-01',
    order: 0,
    createdAt: '2026-10-01T00:00:00Z',
    ...over,
  };
}

export function log(h: Habit, date: string, amount = 1, note?: string): LogEntry {
  return { id: `l${n++}`, habitId: h.id, date, amount, note, loggedAt: `${date}T12:00:00Z` };
}
