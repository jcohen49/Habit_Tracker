# Habit_Tracker

Track daily habits, log progress through the day, and see how consistent you've been over weeks and months.

## Features

- **Today view**: what's due today, a progress ring for the day, and quick logging (tap to check off, +1 for counts, +5/+15/+30 minutes for timed habits, or a custom amount). You can add notes to entries, edit or delete any entry, and switch to past days to backfill.
- **Three habit types**: done / not done, count toward a goal (e.g. 8 glasses), and minutes toward a goal (e.g. read 30 min).
- **Flexible schedules**: every day, specific weekdays, or N times per week on any days.
- **Partial credit**: progress is the share of the goal reached, capped at 100%. The daily score is the equal-weight average of the habits due that day.
- **Calendar**:
  - Week view: a grid of habits × days, shaded by % complete.
  - Month view: a heatmap of daily scores.
  - Click any day to see and edit its entries.
- **Streaks** per habit. Days a habit isn't scheduled don't break the streak. For weekly-goal habits, the streak counts weeks.
- **Weekly and monthly recaps**:
  - What's in them: a scorecard per habit (best to worst) with the change from last period, best day, perfect days, longest streak, totals, and your notes.
  - Reflection: a box to write what to keep or change next time.
  - When they appear: each recap opens on its own the first time you open the app after a week or month ends. All recaps stay in the Recaps tab.
- **Habits manager**: create, edit, reorder, archive and restore habits. Changing a goal or schedule recalculates past days.
- **Backup**: data is stored in your browser's localStorage. Use Settings to export or import a JSON backup, or to load sample data.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # unit tests for progress, streak and recap logic
npm run build
```

## Notes

- Weeks start on Monday. A day ends at local midnight.
- Weekly-goal habits ("gym 3× per week") don't count toward the daily score. They're scored against their weekly target instead.
- Stack: Vite, React 18, TypeScript, date-fns, Vitest. There's no backend. `src/storage.ts` is the only place that touches storage, so sync could be added later.
