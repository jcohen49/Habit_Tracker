import { useState } from 'react';
import type { Habit, HabitKind, Schedule } from '../types';
import type { Store } from '../store';
import { Modal } from './Modal';

export const PALETTE = ['#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'];
const WEEKDAYS: [number, string][] = [
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
  [0, 'Sun'],
];

interface Props {
  habit: Habit | null;
  store: Store;
  today: string;
  onClose: () => void;
}

export function HabitForm({ habit, store, today, onClose }: Props) {
  const [name, setName] = useState(habit?.name ?? '');
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'check');
  const [target, setTarget] = useState(String(habit && habit.kind !== 'check' ? habit.target : 8));
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [color, setColor] = useState(habit?.color ?? PALETTE[store.habits.length % PALETTE.length]);
  const [schedType, setSchedType] = useState<Schedule['type']>(habit?.schedule.type ?? 'daily');
  const [days, setDays] = useState<number[]>(habit?.schedule.type === 'weekdays' ? habit.schedule.days : [1, 3, 5]);
  const [perWeek, setPerWeek] = useState(String(habit?.schedule.type === 'weekly' ? habit.schedule.timesPerWeek : 3));
  const [startDate, setStartDate] = useState(habit?.startDate ?? today);
  const [error, setError] = useState('');

  const schedule: Schedule =
    schedType === 'daily' ? { type: 'daily' } : schedType === 'weekdays' ? { type: 'weekdays', days } : { type: 'weekly', timesPerWeek: Number(perWeek) };
  const numericTarget = kind === 'check' ? 1 : Number(target);
  const goalChanged =
    !!habit &&
    (habit.kind !== kind || habit.target !== numericTarget || JSON.stringify(habit.schedule) !== JSON.stringify(schedule) || habit.startDate !== startDate);

  const submit = () => {
    if (!name.trim()) return setError('Give the habit a name.');
    if (kind !== 'check' && !(numericTarget > 0)) return setError('The daily goal must be more than 0.');
    if (schedType === 'weekdays' && days.length === 0) return setError('Pick at least one day.');
    if (schedType === 'weekly' && !(Number(perWeek) >= 1 && Number(perWeek) <= 7)) return setError('Times per week must be 1–7.');
    store.saveHabit({
      ...(habit ?? {}),
      name: name.trim(),
      kind,
      target: numericTarget,
      unit: kind === 'check' ? undefined : unit.trim() || undefined,
      color,
      schedule,
      startDate,
      archivedAt: habit?.archivedAt,
    });
    onClose();
  };

  return (
    <Modal title={habit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label>
          Name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drink water" />
        </label>

        <fieldset>
          <legend>How do you measure it?</legend>
          <div className="segmented">
            {(
              [
                ['check', 'Done / not done'],
                ['count', 'Count'],
                ['duration', 'Minutes'],
              ] as const
            ).map(([k, label]) => (
              <button type="button" key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {kind !== 'check' && (
          <div className="row">
            <label>
              Goal {schedType === 'weekly' ? 'per session' : 'per day'}
              <input type="number" min={0} step="any" value={target} onChange={(e) => setTarget(e.target.value)} />
            </label>
            <label>
              Unit
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={kind === 'duration' ? 'min' : 'glasses, pages…'} />
            </label>
          </div>
        )}

        <fieldset>
          <legend>How often?</legend>
          <div className="segmented">
            {(
              [
                ['daily', 'Every day'],
                ['weekdays', 'Specific days'],
                ['weekly', 'Times per week'],
              ] as const
            ).map(([t, label]) => (
              <button type="button" key={t} className={schedType === t ? 'on' : ''} onClick={() => setSchedType(t)}>
                {label}
              </button>
            ))}
          </div>
          {schedType === 'weekdays' && (
            <div className="chips">
              {WEEKDAYS.map(([d, label]) => (
                <button
                  type="button"
                  key={d}
                  className={`chip${days.includes(d) ? ' on' : ''}`}
                  aria-pressed={days.includes(d)}
                  onClick={() => setDays((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d]))}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {schedType === 'weekly' && (
            <label className="inline">
              <input type="number" min={1} max={7} value={perWeek} onChange={(e) => setPerWeek(e.target.value)} /> times per week, any days
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend>Color</legend>
          <div className="chips">
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-dot${color === c ? ' on' : ''}`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </fieldset>

        <label>
          Start tracking from
          <input type="date" value={startDate} max={today} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
        </label>

        {goalChanged && (
          <p className="notice warn">Changing the goal or schedule recalculates your past days and recaps with the new settings.</p>
        )}
        {error && <p className="notice error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            {habit ? 'Save changes' : 'Create habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
