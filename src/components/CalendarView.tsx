import type { Period } from '../types';
import type { Store } from '../store';
import { addDaysKey, daysBetween, formatKey, monthEndKey, nextMonthStartKey, weekStartKey } from '../lib/dates';
import { dayScore, habitProgress, isActive, isScheduled, weeklyProgress } from '../lib/progress';
import { periodLabel, periodStart, prevPeriodStart } from '../lib/recap';
import { pct, round1, shade } from '../lib/format';

interface Props {
  store: Store;
  today: string;
  mode: Period;
  setMode: (m: Period) => void;
  anchor: string;
  setAnchor: (d: string) => void;
  onOpenDay: (d: string) => void;
  onOpenRecap: (period: Period, start: string) => void;
}

export function CalendarView({ store, today, mode, setMode, anchor, setAnchor, onOpenDay, onOpenRecap }: Props) {
  const start = periodStart(mode, anchor);
  const next = mode === 'week' ? addDaysKey(start, 7) : nextMonthStartKey(start);
  const isCurrent = start === periodStart(mode, today);

  return (
    <section className="view">
      <header className="view-header wrap">
        <div className="date-nav">
          <button className="icon-btn" onClick={() => setAnchor(prevPeriodStart(mode, start))} aria-label={`Previous ${mode}`}>
            ‹
          </button>
          <h2 className="period-title">{periodLabel(mode, start)}</h2>
          <button className="icon-btn" onClick={() => setAnchor(next)} disabled={next > today} aria-label={`Next ${mode}`}>
            ›
          </button>
        </div>
        <div className="toolbar">
          <div className="segmented" role="tablist" aria-label="Calendar range">
            {(['week', 'month'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
                {m === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          {!isCurrent && (
            <button className="btn small ghost" onClick={() => setAnchor(today)}>
              Today
            </button>
          )}
          <button className="btn small" onClick={() => onOpenRecap(mode, start)}>
            {isCurrent ? `${mode === 'week' ? 'Week' : 'Month'} so far` : 'View recap'}
          </button>
        </div>
      </header>

      {store.habits.length === 0 ? (
        <p className="muted">Add a habit to see your calendar.</p>
      ) : mode === 'week' ? (
        <WeekGrid store={store} start={start} today={today} onOpenDay={onOpenDay} />
      ) : (
        <MonthHeatmap store={store} start={start} today={today} onOpenDay={onOpenDay} />
      )}
      <Legend />
    </section>
  );
}

function Legend() {
  return (
    <div className="legend muted small" aria-hidden="true">
      <span>0%</span>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <span key={p} className="legend-cell" style={shade('var(--accent)', p)} />
      ))}
      <span>100%</span>
      <span className="legend-cell off" /> <span>not due</span>
    </div>
  );
}

function WeekGrid({ store, start, today, onOpenDay }: { store: Store; start: string; today: string; onOpenDay: (d: string) => void }) {
  const days = daysBetween(start, addDaysKey(start, 6));
  const shown = store.habits.filter((h) => days.some((d) => isActive(h, d)));
  const { idx } = store;

  return (
    <div className="grid-scroll">
      <table className="week-grid">
        <thead>
          <tr>
            <th scope="col" className="habit-col">
              Habit
            </th>
            {days.map((d) => (
              <th scope="col" key={d} className={d === today ? 'is-today' : ''}>
                <button className="link" onClick={() => onOpenDay(d)} disabled={d > today}>
                  {formatKey(d, 'EEE')}
                  <span>{formatKey(d, 'd')}</span>
                </button>
              </th>
            ))}
            <th scope="col">Week</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((h) => {
            const weekly = h.schedule.type === 'weekly';
            const due = days.filter((d) => d <= today && isScheduled(h, d));
            const weekPct = weekly
              ? weeklyProgress(h, start, idx).pct
              : due.length
                ? due.reduce((s, d) => s + habitProgress(h, d, idx), 0) / due.length
                : null;
            return (
              <tr key={h.id}>
                <th scope="row" className="habit-col">
                  <span className="swatch sm" style={{ background: h.color }} /> {h.name}
                </th>
                {days.map((d) => {
                  const future = d > today;
                  const counts = weekly ? isActive(h, d) : isScheduled(h, d);
                  const p = habitProgress(h, d, idx);
                  if (!counts || (weekly && p === 0)) {
                    return (
                      <td key={d} className={`cell off${weekly && counts ? ' optional' : ''}`}>
                        <button className="cell-btn" onClick={() => onOpenDay(d)} disabled={future} aria-label={`${h.name}, ${d}: not due`}>
                          {weekly && counts ? '' : '–'}
                        </button>
                      </td>
                    );
                  }
                  return (
                    <td key={d} className={`cell${future ? ' future' : ''}`}>
                      <button
                        className="cell-btn"
                        style={future ? {} : shade(h.color, p)}
                        onClick={() => onOpenDay(d)}
                        disabled={future}
                        aria-label={`${h.name}, ${d}: ${pct(p)}`}
                      >
                        {future ? '' : h.kind === 'check' ? (p >= 1 ? '✓' : '') : pct(p)}
                      </button>
                    </td>
                  );
                })}
                <td className="cell total">
                  <span className="cell-btn" style={shade(h.color, weekPct)}>
                    {weekly ? `${round1(weeklyProgress(h, start, idx).done)}/${h.schedule.type === 'weekly' ? h.schedule.timesPerWeek : 0}` : pct(weekPct)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="habit-col">
              Daily score
            </th>
            {days.map((d) => {
              const s = d > today ? null : dayScore(d, store.habits, idx);
              return (
                <td key={d} className="cell">
                  <span className="cell-btn score" style={shade('var(--accent)', s)}>
                    {s === null ? '' : pct(s)}
                  </span>
                </td>
              );
            })}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MonthHeatmap({ store, start, today, onOpenDay }: { store: Store; start: string; today: string; onOpenDay: (d: string) => void }) {
  const end = monthEndKey(start);
  const gridStart = weekStartKey(start);
  const lead = daysBetween(gridStart, addDaysKey(start, -1)).length;
  const days = daysBetween(start, end);
  return (
    <div className="month">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
        <div key={d} className="month-dow muted small">
          {d}
        </div>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <div key={`b${i}`} />
      ))}
      {days.map((d) => {
        const future = d > today;
        const s = future ? null : dayScore(d, store.habits, store.idx);
        return (
          <button
            key={d}
            className={`month-day${d === today ? ' is-today' : ''}${future ? ' future' : ''}${s === null && !future ? ' off' : ''}`}
            style={shade('var(--accent)', s)}
            onClick={() => onOpenDay(d)}
            disabled={future}
            aria-label={`${formatKey(d, 'MMMM d')}: ${s === null ? 'nothing due' : pct(s)}`}
          >
            <span className="month-num">{formatKey(d, 'd')}</span>
            {s !== null && <span className="month-pct">{pct(s)}</span>}
          </button>
        );
      })}
    </div>
  );
}
