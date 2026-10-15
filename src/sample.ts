import type { AppData, Habit, LogEntry } from './types';
import { addDaysKey, daysBetween, todayKey } from './lib/dates';
import { isActive, isScheduled } from './lib/progress';

/** Six weeks of made-up history so the calendar and recaps have something to show. */
export function sampleData(): AppData {
  const today = todayKey();
  const start = addDaysKey(today, -42);
  const created = new Date().toISOString();
  const habits: Habit[] = [
    { id: 's-water', name: 'Drink water', kind: 'count', target: 8, unit: 'glasses', color: '#0ea5e9', schedule: { type: 'daily' }, startDate: start, order: 0, createdAt: created },
    { id: 's-read', name: 'Read', kind: 'duration', target: 30, unit: 'min', color: '#8b5cf6', schedule: { type: 'daily' }, startDate: start, order: 1, createdAt: created },
    { id: 's-bed', name: 'Make bed', kind: 'check', target: 1, color: '#22c55e', schedule: { type: 'daily' }, startDate: start, order: 2, createdAt: created },
    { id: 's-guitar', name: 'Guitar practice', kind: 'duration', target: 20, unit: 'min', color: '#f97316', schedule: { type: 'weekdays', days: [1, 3, 5] }, startDate: start, order: 3, createdAt: created },
    { id: 's-gym', name: 'Gym', kind: 'check', target: 1, color: '#ef4444', schedule: { type: 'weekly', timesPerWeek: 3 }, startDate: start, order: 4, createdAt: created },
  ];

  // Deterministic pseudo-random so the sample looks the same each time.
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const notes = ['Felt great today', 'Busy day, squeezed it in', 'Tired but did it', 'New personal best', 'Started a new book'];

  const logs: LogEntry[] = [];
  const push = (habitId: string, date: string, amount: number, note?: string) =>
    logs.push({ id: `${habitId}-${date}-${logs.length}`, habitId, date, amount, note, loggedAt: `${date}T${String(8 + (logs.length % 12)).padStart(2, '0')}:00:00.000Z` });

  for (const d of daysBetween(start, addDaysKey(today, -1))) {
    for (const h of habits) {
      if (!isActive(h, d)) continue;
      if (h.schedule.type === 'weekly') {
        if (rand() < 0.42) push(h.id, d, 1);
        continue;
      }
      if (!isScheduled(h, d)) continue;
      const r = rand();
      const note = rand() < 0.06 ? notes[Math.floor(rand() * notes.length)] : undefined;
      if (h.kind === 'check') {
        if (r < 0.8) push(h.id, d, 1, note);
      } else if (h.kind === 'count') {
        const n = Math.min(h.target, Math.round(h.target * (0.4 + r * 0.8)));
        for (let i = 0; i < n; i++) push(h.id, d, 1, i === n - 1 ? note : undefined);
      } else {
        const mins = r < 0.15 ? 0 : Math.round((h.target * (0.3 + r)) / 5) * 5;
        if (mins > 0) push(h.id, d, mins, note);
      }
    }
  }
  push('s-water', today, 3);
  return { version: 1, habits, logs, reflections: {} };
}
