import { useEffect, useState } from 'react';
import type { Habit, Period } from './types';
import { useAppData } from './store';
import { todayKey } from './lib/dates';
import { pendingRecaps, periodEnd } from './lib/recap';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { DayDetail } from './components/DayDetail';
import { HabitsManager } from './components/HabitsManager';
import { HabitForm } from './components/HabitForm';
import { RecapModal, RecapsView } from './components/Recap';
import { Settings } from './components/Settings';

type Tab = 'today' | 'calendar' | 'recaps' | 'habits' | 'settings';
const TABS: [Tab, string][] = [
  ['today', 'Today'],
  ['calendar', 'Calendar'],
  ['recaps', 'Recaps'],
  ['habits', 'Habits'],
  ['settings', 'Settings'],
];

/** Keeps "today" correct if the app stays open past midnight. */
function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const t = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}

export default function App() {
  const store = useAppData();
  const today = useToday();
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(today);
  const [calMode, setCalMode] = useState<Period>('week');
  const [calAnchor, setCalAnchor] = useState(today);
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const [recapQueue, setRecapQueue] = useState<{ period: Period; start: string }[]>([]);

  // Auto-open recaps for weeks/months that ended since the last visit.
  useEffect(() => {
    setRecapQueue((q) => (q.length ? q : pendingRecaps(today, store.habits, store.data.reflections)));
    // Only re-check when the day changes or habits are first added, not on every edit.
  },[today, store.habits.length > 0]);

  const openRecap = recapQueue[0];
  const closeRecap = () => {
    if (openRecap && periodEnd(openRecap.period, openRecap.start) < today) {
      store.setReflection(openRecap.period, openRecap.start, { seenAt: new Date().toISOString() });
    }
    setRecapQueue((q) => q.slice(1));
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          <span aria-hidden="true">◎</span> Habits
        </h1>
        <nav className="tabs" aria-label="Main">
          {TABS.map(([t, label]) => (
            <button key={t} className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'today' && (
          <TodayView store={store} date={date} today={today} setDate={setDate} onEdit={setEditing} onNew={() => setEditing('new')} />
        )}
        {tab === 'calendar' && (
          <CalendarView
            store={store}
            today={today}
            mode={calMode}
            setMode={setCalMode}
            anchor={calAnchor}
            setAnchor={setCalAnchor}
            onOpenDay={setDayDetail}
            onOpenRecap={(period, start) => setRecapQueue((q) => [{ period, start }, ...q])}
          />
        )}
        {tab === 'recaps' && <RecapsView store={store} today={today} />}
        {tab === 'habits' && <HabitsManager store={store} today={today} onEdit={setEditing} onNew={() => setEditing('new')} />}
        {tab === 'settings' && <Settings store={store} />}
      </main>

      {editing && <HabitForm habit={editing === 'new' ? null : editing} store={store} today={today} onClose={() => setEditing(null)} />}
      {dayDetail && (
        <DayDetail
          store={store}
          date={dayDetail}
          onClose={() => setDayDetail(null)}
          onOpenInToday={(d) => {
            setDate(d);
            setDayDetail(null);
            setTab('today');
          }}
        />
      )}
      {openRecap && !editing && !dayDetail && (
        <RecapModal store={store} period={openRecap.period} start={openRecap.start} today={today} onClose={closeRecap} />
      )}
    </div>
  );
}
