import type { Habit } from '../types';
import type { Store } from '../store';
import { scheduleLabel, unitOf } from '../lib/format';
import { formatKey } from '../lib/dates';

interface Props {
  store: Store;
  today: string;
  onEdit: (h: Habit) => void;
  onNew: () => void;
}

export function HabitsManager({ store, today, onEdit, onNew }: Props) {
  const active = store.habits.filter((h) => !h.archivedAt);
  const archived = store.habits.filter((h) => h.archivedAt);

  const goal = (h: Habit) => (h.kind === 'check' ? 'Done / not done' : `${h.target} ${unitOf(h)} ${h.schedule.type === 'weekly' ? 'per session' : 'per day'}`);

  return (
    <section className="view">
      <header className="view-header">
        <h2>Habits</h2>
        <button className="btn" onClick={onNew}>
          + New habit
        </button>
      </header>

      {active.length === 0 && <p className="muted">No active habits. Create one to get started.</p>}
      <ul className="manage-list">
        {active.map((h, i) => (
          <li key={h.id} className="card manage-row" style={{ '--habit': h.color } as React.CSSProperties}>
            <span className="swatch" aria-hidden="true" />
            <div className="grow">
              <strong>{h.name}</strong>
              <div className="muted small">
                {goal(h)} · {scheduleLabel(h)} · since {formatKey(h.startDate, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="row-actions">
              <button className="icon-btn" disabled={i === 0} onClick={() => store.moveHabit(h.id, -1)} aria-label={`Move ${h.name} up`}>
                ↑
              </button>
              <button className="icon-btn" disabled={i === active.length - 1} onClick={() => store.moveHabit(h.id, 1)} aria-label={`Move ${h.name} down`}>
                ↓
              </button>
              <button className="btn small ghost" onClick={() => onEdit(h)}>
                Edit
              </button>
              <button
                className="btn small ghost"
                onClick={() => store.setArchived(h.id, today)}
                title="Stops tracking from today; history is kept"
              >
                Archive
              </button>
            </div>
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <>
          <h3 className="section-title">Archived</h3>
          <p className="muted small">Archived habits keep their history in the calendar and recaps but aren't tracked anymore.</p>
          <ul className="manage-list">
            {archived.map((h) => (
              <li key={h.id} className="card manage-row dimmed" style={{ '--habit': h.color } as React.CSSProperties}>
                <span className="swatch" aria-hidden="true" />
                <div className="grow">
                  <strong>{h.name}</strong>
                  <div className="muted small">Archived {formatKey(h.archivedAt!, 'MMM d, yyyy')}</div>
                </div>
                <button className="btn small ghost" onClick={() => store.setArchived(h.id, undefined)}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
