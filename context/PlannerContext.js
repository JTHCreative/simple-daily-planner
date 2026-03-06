import 'react-native-get-random-values';
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { loadData, saveData } from '../utils/storage';
import { v4 as uuid } from 'uuid';

const PlannerContext = createContext();

const DEFAULT_STATE = {
  groups: [],
  completedTasks: {},
  weeklyGoals: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...DEFAULT_STATE, ...action.payload };

    case 'ADD_GROUP': {
      const newGroup = {
        id: uuid(),
        name: action.payload.name,
        description: action.payload.description || '',
        icon: action.payload.icon || 'sun',
        recurrence: action.payload.recurrence || { type: 'once' },
        createdDate: action.payload.createdDate || new Date().toISOString().split('T')[0],
        tasks: [],
        order: state.groups.length,
      };
      return { ...state, groups: [...state.groups, newGroup] };
    }

    case 'UPDATE_GROUP': {
      const groups = state.groups.map((g) =>
        g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
      );
      return { ...state, groups };
    }

    case 'DELETE_GROUP': {
      const groups = state.groups.filter((g) => g.id !== action.payload);
      return { ...state, groups };
    }

    case 'REORDER_GROUPS':
      return { ...state, groups: action.payload };

    case 'ADD_TASK': {
      const task = {
        id: uuid(),
        name: action.payload.name,
        description: action.payload.description || '',
        subtasks: action.payload.subtasks || [],
        createdDate: action.payload.createdDate || new Date().toISOString().split('T')[0],
      };
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId ? { ...g, tasks: [...g.tasks, task] } : g
      );
      return { ...state, groups };
    }

    case 'UPDATE_TASK': {
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === action.payload.taskId ? { ...t, ...action.payload.updates } : t
              ),
            }
          : g
      );
      return { ...state, groups };
    }

    case 'TOGGLE_SUBTASK': {
      const { subtaskId, dateKey } = action.payload;
      const completed = { ...state.completedTasks };
      if (!completed[dateKey]) completed[dateKey] = {};
      completed[dateKey][subtaskId] = !completed[dateKey][subtaskId];
      return { ...state, completedTasks: completed };
    }

    case 'DELETE_TASK': {
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId
          ? { ...g, tasks: g.tasks.filter((t) => t.id !== action.payload.taskId) }
          : g
      );
      return { ...state, groups };
    }

    case 'TOGGLE_TASK': {
      const { taskId, dateKey } = action.payload;
      const completed = { ...state.completedTasks };
      if (!completed[dateKey]) completed[dateKey] = {};
      completed[dateKey][taskId] = !completed[dateKey][taskId];
      return { ...state, completedTasks: completed };
    }

    case 'ADD_WEEKLY_GOAL': {
      const goal = {
        id: uuid(),
        text: action.payload.text,
        weekKey: action.payload.weekKey,
        subtasks: action.payload.subtasks || [],
        completed: false,
      };
      return { ...state, weeklyGoals: [...state.weeklyGoals, goal] };
    }

    case 'UPDATE_WEEKLY_GOAL': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
      );
      return { ...state, weeklyGoals };
    }

    case 'TOGGLE_WEEKLY_GOAL': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload ? { ...g, completed: !g.completed } : g
      );
      return { ...state, weeklyGoals };
    }

    case 'TOGGLE_GOAL_SUBTASK': {
      const { goalId, subtaskId } = action.payload;
      const weeklyGoals = state.weeklyGoals.map((g) => {
        if (g.id !== goalId) return g;
        const subtasks = (g.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...g, subtasks };
      });
      return { ...state, weeklyGoals };
    }

    case 'DELETE_WEEKLY_GOAL': {
      const weeklyGoals = state.weeklyGoals.filter((g) => g.id !== action.payload);
      return { ...state, weeklyGoals };
    }

    default:
      return state;
  }
}

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const isLoaded = useRef(false);

  useEffect(() => {
    loadData().then((saved) => {
      if (saved) {
        dispatch({ type: 'LOAD_DATA', payload: saved });
      }
      isLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      saveData(state);
    }
  }, [state]);

  return (
    <PlannerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
