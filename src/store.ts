import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppData, Habit, LogEntry, Period, Reflection } from './types';
import { loadData, saveData } from './storage';
import { indexLogs } from './lib/progress';
import { periodId } from './lib/recap';

const uid = () => crypto.randomUUID();

/** All app state plus the actions that change it. Every change is saved to localStorage. */
export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);
  useEffect(() => saveData(data), [data]);

  const idx = useMemo(() => indexLogs(data.logs), [data.logs]);
  const habits = useMemo(() => [...data.habits].sort((a, b) => a.order - b.order), [data.habits]);

  const saveHabit = useCallback((h: Omit<Habit, 'id' | 'order' | 'createdAt'> & Partial<Habit>) => {
    setData((d) => {
      if (h.id && d.habits.some((x) => x.id === h.id)) {
        return { ...d, habits: d.habits.map((x) => (x.id === h.id ? ({ ...x, ...h } as Habit) : x)) };
      }
      const order = d.habits.reduce((m, x) => Math.max(m, x.order), -1) + 1;
      const habit: Habit = { ...h, id: uid(), order, createdAt: new Date().toISOString() } as Habit;
      return { ...d, habits: [...d.habits, habit] };
    });
  }, []);

  const setArchived = useCallback((id: string, archivedAt: string | undefined) => {
    setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, archivedAt } : h)) }));
  }, []);

  /** Swap a habit with its neighbour in the display order. */
  const moveHabit = useCallback((id: string, dir: -1 | 1) => {
    setData((d) => {
      const sorted = [...d.habits].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((h) => h.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return d;
      const a = sorted[i];
      const b = sorted[j];
      return {
        ...d,
        habits: d.habits.map((h) => (h.id === a.id ? { ...h, order: b.order } : h.id === b.id ? { ...h, order: a.order } : h)),
      };
    });
  }, []);

  const addLog = useCallback((habitId: string, date: string, amount: number, note?: string) => {
    const entry: LogEntry = { id: uid(), habitId, date, amount, note: note?.trim() || undefined, loggedAt: new Date().toISOString() };
    setData((d) => ({ ...d, logs: [...d.logs, entry] }));
  }, []);

  const updateLog = useCallback((id: string, patch: Partial<Pick<LogEntry, 'amount' | 'note'>>) => {
    setData((d) => ({ ...d, logs: d.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);

  const deleteLogs = useCallback((ids: string[]) => {
    const drop = new Set(ids);
    setData((d) => ({ ...d, logs: d.logs.filter((l) => !drop.has(l.id)) }));
  }, []);

  /** Undo one unit: shrink the latest entry by `amount`, or remove it if it would hit zero. */
  const decrement = useCallback((habitId: string, date: string, amount: number) => {
    setData((d) => {
      const entries = d.logs.filter((l) => l.habitId === habitId && l.date === date);
      const last = entries.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))[entries.length - 1];
      if (!last) return d;
      if (last.amount > amount) {
        return { ...d, logs: d.logs.map((l) => (l.id === last.id ? { ...l, amount: l.amount - amount } : l)) };
      }
      return { ...d, logs: d.logs.filter((l) => l.id !== last.id) };
    });
  }, []);

  const setReflection = useCallback((period: Period, start: string, patch: { text?: string; seenAt?: string }) => {
    const id = periodId(period, start);
    setData((d) => {
      const existing: Reflection = d.reflections[id] ?? { id, period, start, text: '' };
      return { ...d, reflections: { ...d.reflections, [id]: { ...existing, ...patch } } };
    });
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  return {
    data,
    habits,
    idx,
    saveHabit,
    setArchived,
    moveHabit,
    addLog,
    updateLog,
    deleteLogs,
    decrement,
    setReflection,
    replaceAll,
  };
}

export type Store = ReturnType<typeof useAppData>;
