import { useState } from 'react';
import type { Habit } from '../types';
import type { Store } from '../store';
import { amountLabel, unitOf } from '../lib/format';

interface Props {
  habit: Habit;
  date: string;
  store: Store;
}

/** Every entry logged for one habit on one day, editable in place, plus a form to add one with a note. */
export function EntryList({ habit, date, store }: Props) {
  const entries = store.data.logs
    .filter((l) => l.habitId === habit.id && l.date === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const defaultAmount = habit.kind === 'duration' ? 15 : 1;
  const [amount, setAmount] = useState(String(defaultAmount));
  const [note, setNote] = useState('');

  const add = () => {
    const n = habit.kind === 'check' ? 1 : Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    store.addLog(habit.id, date, n, note);
    setNote('');
    setAmount(String(defaultAmount));
  };

  return (
    <div className="entries">
      {entries.length === 0 && <p className="muted small">Nothing logged yet.</p>}
      {entries.map((e) => (
        <div className="entry" key={e.id}>
          <span className="entry-time">
            {new Date(e.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          {habit.kind === 'check' ? (
            <span className="entry-amount">{amountLabel(habit, e.amount)}</span>
          ) : (
            <label className="entry-amount">
              <input
                type="number"
                min={0}
                step="any"
                defaultValue={e.amount}
                aria-label={`Amount in ${unitOf(habit)}`}
                onBlur={(ev) => {
                  const n = Number(ev.target.value);
                  if (Number.isFinite(n) && n > 0 && n !== e.amount) store.updateLog(e.id, { amount: n });
                }}
              />
              <span className="muted small">{unitOf(habit)}</span>
            </label>
          )}
          <input
            className="entry-note"
            placeholder="Add a note…"
            defaultValue={e.note ?? ''}
            onBlur={(ev) => {
              const v = ev.target.value.trim() || undefined;
              if (v !== e.note) store.updateLog(e.id, { note: v });
            }}
          />
          <button className="icon-btn danger" title="Delete entry" aria-label="Delete entry" onClick={() => store.deleteLogs([e.id])}>
            ×
          </button>
        </div>
      ))}
      <form
        className="entry add"
        onSubmit={(ev) => {
          ev.preventDefault();
          add();
        }}
      >
        {habit.kind !== 'check' && (
          <label className="entry-amount">
            <input type="number" min={0} step="any" value={amount} onChange={(ev) => setAmount(ev.target.value)} aria-label="Amount" />
            <span className="muted small">{unitOf(habit)}</span>
          </label>
        )}
        <input className="entry-note" placeholder="Note (optional)" value={note} onChange={(ev) => setNote(ev.target.value)} />
        <button className="btn small" type="submit">
          {habit.kind === 'check' ? 'Mark done' : 'Log'}
        </button>
      </form>
    </div>
  );
}
