import { useState } from 'react';
import type { Habit } from '../types';
import type { Store } from '../store';
import { dayAmount, habitProgress, streak, weeklyProgress } from '../lib/progress';
import { amountVsTarget, pct, round1, scheduleLabel, unitOf } from '../lib/format';
import { weekStartKey } from '../lib/dates';
import { EntryList } from './EntryList';

interface Props {
  habit: Habit;
  date: string;
  today: string;
  store: Store;
  onEdit: (h: Habit) => void;
  dimmed?: boolean;
}

export function HabitCard({ habit, date, today, store, onEdit, dimmed }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const { idx } = store;
  const amount = dayAmount(idx, habit.id, date);
  const progress = habitProgress(habit, date, idx);
  const weekly = habit.schedule.type === 'weekly' ? weeklyProgress(habit, weekStartKey(date), idx) : null;
  const s = streak(habit, idx, today);
  const entryCount = store.data.logs.filter((l) => l.habitId === habit.id && l.date === date).length;
  const done = progress >= 1;

  const logCustom = () => {
    const n = Number(custom);
    if (Number.isFinite(n) && n > 0) store.addLog(habit.id, date, n);
    setCustom('');
  };

  return (
    <article className={`card habit-card${done ? ' done' : ''}${dimmed ? ' dimmed' : ''}`} style={{ '--habit': habit.color } as React.CSSProperties}>
      <div className="habit-main">
        {habit.kind === 'check' ? (
          <button
            className={`check${done ? ' on' : ''}`}
            aria-pressed={done}
            aria-label={done ? `Unmark ${habit.name}` : `Mark ${habit.name} done`}
            onClick={() => {
              if (done) {
                store.deleteLogs(store.data.logs.filter((l) => l.habitId === habit.id && l.date === date).map((l) => l.id));
              } else {
                store.addLog(habit.id, date, 1);
              }
            }}
          >
            {done ? '✓' : ''}
          </button>
        ) : (
          <span className="swatch" aria-hidden="true" />
        )}
        <div className="habit-info">
          <div className="habit-title">
            <h3>{habit.name}</h3>
            {s.current > 0 && (
              <span className="streak" title={`Best: ${s.best} ${s.unit}${s.best === 1 ? '' : 's'}`}>
                🔥 {s.current} {s.unit}
                {s.current === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="muted small">
            {amountVsTarget(habit, amount)}
            {weekly && ` · This week ${round1(weekly.done)} / ${weekly.quota}`}
            {' · '}
            {scheduleLabel(habit)}
          </div>
          <div className="bar" aria-label={`${pct(weekly ? weekly.pct : progress)} complete`}>
            <span style={{ width: `${(weekly ? weekly.pct : progress) * 100}%` }} />
          </div>
        </div>
        <span className="habit-pct">{pct(weekly ? weekly.pct : progress)}</span>
      </div>

      <div className="habit-actions">
        {habit.kind === 'count' && (
          <>
            <button className="btn small ghost" onClick={() => store.decrement(habit.id, date, 1)} disabled={amount <= 0} aria-label="Remove one">
              −1
            </button>
            <button className="btn small" onClick={() => store.addLog(habit.id, date, 1)}>
              +1 {unitOf(habit)}
            </button>
          </>
        )}
        {habit.kind === 'duration' &&
          [5, 15, 30].map((m) => (
            <button key={m} className="btn small" onClick={() => store.addLog(habit.id, date, m)}>
              +{m} {unitOf(habit)}
            </button>
          ))}
        {habit.kind !== 'check' && (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              logCustom();
            }}
          >
            <input type="number" min={0} step="any" placeholder="Custom" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label={`Custom amount in ${unitOf(habit)}`} />
            <button className="btn small ghost" type="submit" disabled={!custom}>
              Add
            </button>
          </form>
        )}
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Hide entries' : `Entries & notes${entryCount ? ` (${entryCount})` : ''}`}
        </button>
        <button className="btn small ghost" onClick={() => onEdit(habit)}>
          Edit
        </button>
      </div>
      {open && <EntryList habit={habit} date={date} store={store} />}
    </article>
  );
}
