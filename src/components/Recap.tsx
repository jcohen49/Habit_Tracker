import { useMemo, useState } from 'react';
import type { Period } from '../types';
import type { Store } from '../store';
import { buildRecap, listPeriods, periodId, periodLabel } from '../lib/recap';
import { formatKey } from '../lib/dates';
import { amountLabel, pct, round1, signedPct, unitOf } from '../lib/format';
import { ProgressRing } from './ProgressRing';
import { Modal } from './Modal';

interface ContentProps {
  store: Store;
  period: Period;
  start: string;
  today: string;
}

function Delta({ value, suffix = ' pts' }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="delta muted">new</span>;
  const n = Math.round(value * 100);
  const cls = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return (
    <span className={`delta ${cls}`} title="Change vs previous period">
      {n > 0 ? '▲' : n < 0 ? '▼' : '•'} {signedPct(value)}
      {suffix}
    </span>
  );
}

/** Scorecard, comparison, highlights, notes and reflection for one week or month. */
export function RecapContent({ store, period, start, today }: ContentProps) {
  const r = useMemo(
    () => buildRecap(period, start, store.habits, store.data.logs, store.idx, today),
    [period, start, store.habits, store.data.logs, store.idx, today],
  );
  const reflection = store.data.reflections[periodId(period, start)]?.text ?? '';
  const noun = period === 'week' ? 'week' : 'month';

  if (r.habits.length === 0) {
    return <p className="muted">No habits were tracked during this {noun}.</p>;
  }

  return (
    <div className="recap">
      <div className="recap-hero">
        <ProgressRing value={r.overall} size={132} label={r.inProgress ? 'so far' : 'overall'} />
        <div>
          <p className="eyebrow">{r.inProgress ? `This ${noun} so far` : `${noun[0].toUpperCase()}${noun.slice(1)} recap`}</p>
          <h3>{periodLabel(period, start)}</h3>
          <p>
            <Delta value={r.delta} /> <span className="muted small">vs last {noun} ({pct(r.prevOverall)})</span>
          </p>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <span className="tile-label">Best day</span>
          <strong>{r.bestDay ? formatKey(r.bestDay.date, 'EEE, MMM d') : '–'}</strong>
          <span className="muted small">{r.bestDay ? pct(r.bestDay.score) : ''}</span>
        </div>
        <div className="tile">
          <span className="tile-label">Perfect days</span>
          <strong>
            {r.perfectDays} / {r.scoredDays}
          </strong>
          <span className="muted small">all daily habits at 100%</span>
        </div>
        <div className="tile">
          <span className="tile-label">Longest streak</span>
          <strong>{r.longestStreak ? `${r.longestStreak.length} day${r.longestStreak.length === 1 ? '' : 's'}` : '–'}</strong>
          <span className="muted small">{r.longestStreak?.habit.name ?? ''}</span>
        </div>
      </div>

      <h4 className="section-title">Scorecard</h4>
      <ul className="scorecard">
        {r.habits.map((h) => (
          <li key={h.habit.id} style={{ '--habit': h.habit.color } as React.CSSProperties}>
            <div className="score-row">
              <span className="swatch sm" />
              <span className="grow">{h.habit.name}</span>
              <span className="muted small total">
                {h.habit.kind === 'check' ? `${h.total} day${h.total === 1 ? '' : 's'}` : `${round1(h.total)} ${unitOf(h.habit)}`}
              </span>
              <strong className="score-pct">{pct(h.pct)}</strong>
              <Delta value={h.delta} suffix="" />
            </div>
            <div className="bar">
              <span style={{ width: `${h.pct * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {r.notes.length > 0 && (
        <>
          <h4 className="section-title">Your notes</h4>
          <ul className="notes">
            {r.notes.map((n) => (
              <li key={n.id}>
                <span className="muted small">
                  {formatKey(n.date, 'EEE, MMM d')} · {n.habit.name} · {amountLabel(n.habit, n.amount)}
                </span>
                <p>{n.note}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h4 className="section-title">Reflection</h4>
      <textarea
        className="reflection"
        rows={4}
        placeholder={`What went well this ${noun}? What will you keep or change next ${noun}?`}
        defaultValue={reflection}
        key={periodId(period, start)}
        onChange={(e) => store.setReflection(period, start, { text: e.target.value })}
      />
      <p className="muted small">Saved automatically.</p>
    </div>
  );
}

export function RecapModal({
  store,
  period,
  start,
  today,
  onClose,
}: ContentProps & { onClose: () => void }) {
  return (
    <Modal title={period === 'week' ? 'Weekly recap' : 'Monthly recap'} onClose={onClose} wide>
      <RecapContent store={store} period={period} start={start} today={today} />
    </Modal>
  );
}

/** Archive of every week or month since tracking began. */
export function RecapsView({ store, today }: { store: Store; today: string }) {
  const [period, setPeriod] = useState<Period>('week');
  const periods = listPeriods(period, store.habits, today);
  const [selected, setSelected] = useState<string | null>(null);
  const current = selected && periods.includes(selected) ? selected : (periods[1] ?? periods[0]);

  return (
    <section className="view">
      <header className="view-header wrap">
        <h2>Recaps</h2>
        <div className="segmented" role="tablist" aria-label="Recap period">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              className={period === p ? 'on' : ''}
              onClick={() => {
                setPeriod(p);
                setSelected(null);
              }}
            >
              {p === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </header>
      {periods.length === 0 ? (
        <p className="muted">Recaps appear once you've added a habit.</p>
      ) : (
        <div className="recaps-layout">
          <nav className="recap-list" aria-label="Past recaps">
            {periods.map((s, i) => {
              const hasReflection = !!store.data.reflections[periodId(period, s)]?.text;
              return (
                <button key={s} className={`recap-link${s === current ? ' on' : ''}`} onClick={() => setSelected(s)}>
                  <span>{periodLabel(period, s)}</span>
                  <span className="muted small">
                    {i === 0 ? 'in progress' : ''}
                    {hasReflection ? ' ✎' : ''}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="card recap-panel">
            {current && <RecapContent store={store} period={period} start={current} today={today} />}
          </div>
        </div>
      )}
    </section>
  );
}
