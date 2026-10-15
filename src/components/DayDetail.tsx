import type { Store } from '../store';
import { formatKey, weekStartKey } from '../lib/dates';
import { dayAmount, dayScore, habitProgress, isActive, isScheduled, weeklyProgress } from '../lib/progress';
import { amountVsTarget, pct, round1 } from '../lib/format';
import { Modal } from './Modal';
import { EntryList } from './EntryList';

interface Props {
  store: Store;
  date: string;
  onClose: () => void;
  onOpenInToday: (d: string) => void;
}

/** One day's breakdown, with every habit's entries editable so past days can be fixed or backfilled. */
export function DayDetail({ store, date, onClose, onOpenInToday }: Props) {
  const score = dayScore(date, store.habits, store.idx);
  const due = store.habits.filter((h) => isScheduled(h, date));
  const weekly = store.habits.filter((h) => h.schedule.type === 'weekly' && isActive(h, date));

  return (
    <Modal title={formatKey(date, 'EEEE, MMMM d, yyyy')} onClose={onClose} wide>
      <div className="detail-head">
        <p>
          Daily score: <strong>{pct(score)}</strong>
        </p>
        <button className="btn small ghost" onClick={() => onOpenInToday(date)}>
          Open this day in Today
        </button>
      </div>
      {due.length === 0 && weekly.length === 0 && <p className="muted">No habits were active on this day.</p>}
      {[...due, ...weekly].map((h) => {
        const p = habitProgress(h, date, store.idx);
        const w = h.schedule.type === 'weekly' ? weeklyProgress(h, weekStartKey(date), store.idx) : null;
        return (
          <section key={h.id} className="detail-habit" style={{ '--habit': h.color } as React.CSSProperties}>
            <div className="detail-habit-head">
              <span className="swatch" />
              <strong>{h.name}</strong>
              <span className="muted small">
                {amountVsTarget(h, dayAmount(store.idx, h.id, date))}
                {w && ` · week ${round1(w.done)}/${w.quota}`}
              </span>
              <span className="habit-pct">{pct(p)}</span>
            </div>
            <div className="bar">
              <span style={{ width: `${p * 100}%` }} />
            </div>
            <EntryList habit={h} date={date} store={store} />
          </section>
        );
      })}
    </Modal>
  );
}
