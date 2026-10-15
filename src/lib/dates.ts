import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import type { DateKey } from '../types';

export const toKey = (d: Date): DateKey => format(d, 'yyyy-MM-dd');
export const fromKey = (k: DateKey): Date => parseISO(k);
export const todayKey = (): DateKey => toKey(new Date());

export const addDaysKey = (k: DateKey, n: number): DateKey => toKey(addDays(fromKey(k), n));
export const weekStartKey = (k: DateKey): DateKey =>
  toKey(startOfWeek(fromKey(k), { weekStartsOn: 1 }));
export const monthStartKey = (k: DateKey): DateKey => toKey(startOfMonth(fromKey(k)));
export const monthEndKey = (k: DateKey): DateKey => toKey(endOfMonth(fromKey(k)));
export const prevMonthStartKey = (k: DateKey): DateKey =>
  toKey(startOfMonth(subMonths(fromKey(k), 1)));
export const nextMonthStartKey = (k: DateKey): DateKey =>
  toKey(startOfMonth(subMonths(fromKey(k), -1)));

/** Inclusive list of days from start to end; empty if end < start. */
export function daysBetween(start: DateKey, end: DateKey): DateKey[] {
  if (end < start) return [];
  return eachDayOfInterval({ start: fromKey(start), end: fromKey(end) }).map(toKey);
}

export const dayOfWeek = (k: DateKey): number => fromKey(k).getDay();
export const formatKey = (k: DateKey, fmt: string): string => format(fromKey(k), fmt);

export const minKey = (a: DateKey, b: DateKey): DateKey => (a < b ? a : b);
export const maxKey = (a: DateKey, b: DateKey): DateKey => (a > b ? a : b);
