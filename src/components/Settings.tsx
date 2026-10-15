import { useRef, useState } from 'react';
import type { Store } from '../store';
import { emptyData, isAppData } from '../storage';
import { sampleData } from '../sample';
import { todayKey } from '../lib/dates';

export function Settings({ store }: { store: Store }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const { habits, logs } = store.data;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  };

  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isAppData(parsed)) throw new Error('bad shape');
      if (!confirm('Replace all current habits and logs with this backup?')) return;
      store.replaceAll(parsed);
      setMessage(`Imported ${parsed.habits.length} habits and ${parsed.logs.length} entries.`);
    } catch {
      setMessage("That file isn't a Habit Tracker backup.");
    }
  };

  return (
    <section className="view">
      <header className="view-header">
        <h2>Settings</h2>
      </header>

      <div className="card stack">
        <h3>Backup</h3>
        <p className="muted">
          Your data lives only in this browser ({habits.length} habits, {logs.length} entries). Clearing site data erases it, so export a backup now and then.
        </p>
        <div className="row-actions">
          <button className="btn" onClick={exportJson}>
            Export backup
          </button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>
            Import backup…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />
        </div>
        {message && <p className="notice">{message}</p>}
      </div>

      <div className="card stack">
        <h3>Try it out</h3>
        <p className="muted">Load six weeks of made-up history to explore the calendar and recaps. This replaces your current data.</p>
        <div className="row-actions">
          <button
            className="btn ghost"
            onClick={() => confirm('Replace your data with sample data?') && store.replaceAll(sampleData())}
          >
            Load sample data
          </button>
          <button
            className="btn ghost danger"
            onClick={() => confirm('Erase all habits, entries and reflections? This cannot be undone.') && store.replaceAll(emptyData())}
          >
            Erase everything
          </button>
        </div>
      </div>
    </section>
  );
}
