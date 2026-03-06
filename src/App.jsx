import { useState } from 'react';
import { PlannerProvider } from './context/PlannerContext';
import DateHeader from './components/DateHeader';
import WeeklyGoals from './components/WeeklyGoals';
import Timeline from './components/Timeline';
import './App.css';

function AppContent() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState('daily');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">My Planner</h1>
      </header>

      <nav className="view-tabs">
        <button
          className={`tab ${view === 'daily' ? 'active' : ''}`}
          onClick={() => setView('daily')}
        >
          Daily
        </button>
        <button
          className={`tab ${view === 'goals' ? 'active' : ''}`}
          onClick={() => setView('goals')}
        >
          Weekly Goals
        </button>
      </nav>

      <DateHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {view === 'goals' ? (
        <WeeklyGoals selectedDate={selectedDate} />
      ) : (
        <Timeline selectedDate={selectedDate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlannerProvider>
      <AppContent />
    </PlannerProvider>
  );
}
