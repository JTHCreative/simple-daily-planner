# Simple Daily Planner

A React Native daily planner app built with Expo. Organize your day with task groups, repeating tasks, and weekly goals.

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Features

- **Task Groups** - Create ordered groups (Morning Routine, House Chores, etc.) with icons
- **Tasks** - Tap to complete, long-press to edit/delete
- **Recurrence** - Tasks and groups can repeat daily, weekly, on custom days, or be one-time
- **Timeline View** - Groups connected by a visual path showing your day's flow
- **Weekly Goals** - Track goals for the current week
- **Dark Mode** - Follows system preference
- **Home Center Sync** - Pulls this week's goals from the [Home Center](https://jthcreative.github.io/home-center/#/dashboard) dashboard once a day (on app open / return to foreground, after the 3 AM day reset). Sub-items become tasks, nested sub-items become subtasks, and tally goals show their count (e.g. 3/7). Checking items off in the planner (tasks, subtasks, or Home Center goals without sub-items) is sent back to Home Center within a couple of seconds, and queued until you're back online if needed. Choose which Home Center goal lists to pull, or sync on demand, under Settings → Home Center Goals.
