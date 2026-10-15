import type { AppData } from './types';

const STORAGE_KEY = 'habit-tracker:v1';

export const emptyData = (): AppData => ({ version: 1, habits: [], logs: [], reflections: {} });

export function isAppData(x: unknown): x is AppData {
  const d = x as AppData;
  return (
    !!d &&
    d.version === 1 &&
    Array.isArray(d.habits) &&
    Array.isArray(d.logs) &&
    typeof d.reflections === 'object' &&
    d.reflections !== null
  );
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed: unknown = JSON.parse(raw);
    return isAppData(parsed) ? parsed : emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
}
