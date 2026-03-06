import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import './WeeklyGoals.css';

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export default function WeeklyGoals({ selectedDate }) {
  const { state, dispatch } = usePlanner();
  const [newGoal, setNewGoal] = useState('');

  const weekKey = getWeekKey(selectedDate);
  const goals = state.weeklyGoals.filter(g => g.weekKey === weekKey);

  const addGoal = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    dispatch({ type: 'ADD_WEEKLY_GOAL', payload: { text: newGoal.trim(), weekKey } });
    setNewGoal('');
  };

  return (
    <div className="weekly-goals">
      <div className="weekly-goals-header">
        <h3>Weekly Goals</h3>
        <span className="goal-progress">
          {goals.filter(g => g.completed).length}/{goals.length}
        </span>
      </div>

      {goals.length > 0 && (
        <div className="goals-list">
          {goals.map(goal => (
            <div
              key={goal.id}
              className={`goal-item ${goal.completed ? 'completed' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_WEEKLY_GOAL', payload: goal.id })}
            >
              <div className={`goal-dot ${goal.completed ? 'filled' : ''}`} />
              <span className={goal.completed ? 'struck' : ''}>{goal.text}</span>
              <button
                className="goal-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: goal.id });
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addGoal} className="add-goal-form">
        <input
          type="text"
          className="goal-input"
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          placeholder="Add a weekly goal..."
        />
        <button type="submit" className="goal-add-btn" disabled={!newGoal.trim()}>
          +
        </button>
      </form>
    </div>
  );
}
