import type { CSSProperties } from 'react';
import type { Habit } from '../types';

export const pct = (p: number | null | undefined): string => (p === null || p === undefined ? '–' : `${Math.round(p * 100)}%`);

export function signedPct(delta: number | null): string {
  if (delta === null) return '';
  const n = Math.round(delta * 100);
  return n === 0 ? '±0' : `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
}

export const unitOf = (h: Habit): string => h.unit || (h.kind === 'duration' ? 'min' : h.kind === 'count' ? 'times' : '');

/** "5 / 8 glasses", "15 / 30 min", or "Done" / "Not done". */
export function amountVsTarget(h: Habit, amount: number): string {
  if (h.kind === 'check') return amount > 0 ? 'Done' : 'Not done';
  return `${round1(amount)} / ${h.target} ${unitOf(h)}`;
}

export function amountLabel(h: Habit, amount: number): string {
  if (h.kind === 'check') return 'Done';
  return `${round1(amount)} ${unitOf(h)}`;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;

export function scheduleLabel(h: Habit): string {
  const s = h.schedule;
  if (s.type === 'daily') return 'Every day';
  if (s.type === 'weekly') return `${s.timesPerWeek}× per week`;
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => s.days.includes(d)).map((d) => names[d]).join(', ');
}

/** Cell shading: the colour gets stronger as progress rises; zero progress stays neutral. */
export function shade(color: string, p: number | null): CSSProperties {
  if (p === null) return {};
  if (p <= 0) return { background: 'var(--cell-zero)' };
  const strength = Math.round(18 + p * 82);
  return {
    background: `color-mix(in srgb, ${color} ${strength}%, var(--cell))`,
    color: p >= 0.55 ? '#fff' : 'var(--text)',
  };
}
