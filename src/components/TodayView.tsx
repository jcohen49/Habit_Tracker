import type { Habit } from '../types';
import type { Store } from '../store';
import { addDaysKey, formatKey } from '../lib/dates';
import { dayScore, habitProgress, isActive, isScheduled } from '../lib/progress';
import { ProgressRing } from './ProgressRing';
import { HabitCard } from './HabitCard';

interface Props {
  store: Store;
  date: string;
  today: string;
  setDate: (d: string) => void;
  onEdit: (h: Habit) => void;
  onNew: () => void;
}

export function TodayView({ store, date, today, setDate, onEdit, onNew }: Props) {
  const active = store.habits.filter((h) => isActive(h, date));
  const due = active.filter((h) => isScheduled(h, date));
  const weekly = active.filter((h) => h.schedule.type === 'weekly');
  const notDue = active.filter((h) => h.schedule.type === 'weekdays' && !isScheduled(h, date));
  const score = dayScore(date, store.habits, store.idx);
  const doneCount = due.filter((h) => habitProgress(h, date, store.idx) >= 1).length;
  const isToday = date === today;

  return (
    <section className="view">
      <header className="day-header">
        <div className="date-nav">
          <button className="icon-btn" onClick={() => setDate(addDaysKey(date, -1))} aria-label="Previous day">
            ‹
          </button>
          <div>
            <h2>{isToday ? 'Today' : formatKey(date, 'EEEE')}</h2>
            <p className="muted">{formatKey(date, 'MMMM d, yyyy')}</p>
          </div>
          <button className="icon-btn" onClick={() => setDate(addDaysKey(date, 1))} disabled={date >= today} aria-label="Next day">
            ›
          </button>
        </div>
        <div className="date-tools">
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a day" />
          {!isToday && (
            <button className="btn small ghost" onClick={() => setDate(today)}>
              Back to today
            </button>
          )}
        </div>
      </header>

      {!isToday && <p className="notice">You're logging for {formatKey(date, 'EEE, MMM d')}. Entries count toward that day.</p>}

      {store.habits.length === 0 ? (
        <div className="empty card">
          <h3>No habits yet</h3>
          <p className="muted">Add your first habit to start tracking. Or load sample data from Settings to look around.</p>
          <button className="btn" onClick={onNew}>
            + New habit
          </button>
        </div>
      ) : (
        <>
          <div className="summary card">
            <ProgressRing value={score} label={isToday ? 'today' : 'that day'} />
            <div>
              <h3>{score === null ? 'Nothing due' : score >= 1 ? 'All done! 🎉' : 'Daily progress'}</h3>
              <p className="muted">
                {due.length} habit{due.length === 1 ? '' : 's'} due · {doneCount} complete
                {weekly.length > 0 && ` · ${weekly.length} weekly goal${weekly.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {due.length > 0 && (
            <div className="list">
              {due.map((h) => (
                <HabitCard key={h.id} habit={h} date={date} today={today} store={store} onEdit={onEdit} />
              ))}
            </div>
          )}

          {weekly.length > 0 && (
            <>
              <h3 className="section-title">This week's goals</h3>
              <div className="list">
                {weekly.map((h) => (
                  <HabitCard key={h.id} habit={h} date={date} today={today} store={store} onEdit={onEdit} />
                ))}
              </div>
            </>
          )}

          {notDue.length > 0 && (
            <details className="not-due">
              <summary>Not due {isToday ? 'today' : 'this day'} ({notDue.length})</summary>
              <div className="list">
                {notDue.map((h) => (
                  <HabitCard key={h.id} habit={h} date={date} today={today} store={store} onEdit={onEdit} dimmed />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
