import 'react-native-get-random-values';
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { loadData, saveData } from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { scheduleTaskAlarm, cancelTaskAlarm } from '../utils/notifications';

const PlannerContext = createContext();

const DEFAULT_STATE = {
  groups: [],
  completedTasks: {},
  weeklyGoals: [],
  settings: {
    userName: '',
    themeMode: 'system', // 'system' | 'light' | 'dark'
  },
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
      // Cancel alarms for all tasks in the deleted group
      const deletedGroup = state.groups.find((g) => g.id === action.payload);
      if (deletedGroup) {
        deletedGroup.tasks.forEach((t) => {
          if (t.alarm?.enabled) cancelTaskAlarm(t.id);
        });
      }
      const groups = state.groups.filter((g) => g.id !== action.payload);
      return { ...state, groups };
    }

    case 'REORDER_GROUPS':
      return { ...state, groups: action.payload };

    case 'ADD_TASK': {
      const taskId = uuid();
      const alarm = action.payload.alarm || { enabled: false, hour: 8, minute: 0 };
      const task = {
        id: taskId,
        name: action.payload.name,
        description: action.payload.description || '',
        subtasks: action.payload.subtasks || [],
        createdDate: action.payload.createdDate || new Date().toISOString().split('T')[0],
        recurrence: action.payload.recurrence || 'daily',
        alarm,
      };
      if (alarm.enabled) {
        scheduleTaskAlarm(taskId, task.name, alarm.hour, alarm.minute);
      }
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId ? { ...g, tasks: [...g.tasks, task] } : g
      );
      return { ...state, groups };
    }

    case 'UPDATE_TASK': {
      const { updates, taskId: updateTaskId } = action.payload;
      if (updates.alarm) {
        if (updates.alarm.enabled) {
          const taskName = updates.name || state.groups
            .flatMap((g) => g.tasks)
            .find((t) => t.id === updateTaskId)?.name || 'Task';
          scheduleTaskAlarm(updateTaskId, taskName, updates.alarm.hour, updates.alarm.minute);
        } else {
          cancelTaskAlarm(updateTaskId);
        }
      }
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === updateTaskId ? { ...t, ...updates } : t
              ),
            }
          : g
      );
      return { ...state, groups };
    }

    case 'TOGGLE_SUBTASK': {
      const { subtaskId, dateKey, taskId, allSubtaskIds } = action.payload;
      const completed = { ...state.completedTasks };
      if (!completed[dateKey]) completed[dateKey] = {};
      completed[dateKey] = { ...completed[dateKey] };
      completed[dateKey][subtaskId] = !completed[dateKey][subtaskId];
      // Auto-complete parent task when all subtasks are done
      if (taskId && allSubtaskIds) {
        const allDone = allSubtaskIds.every((id) => completed[dateKey][id]);
        completed[dateKey][taskId] = allDone;
      }
      return { ...state, completedTasks: completed };
    }

    case 'DELETE_TASK': {
      // Cancel alarm if the deleted task had one
      const deletedTask = state.groups
        .find((g) => g.id === action.payload.groupId)
        ?.tasks.find((t) => t.id === action.payload.taskId);
      if (deletedTask?.alarm?.enabled) {
        cancelTaskAlarm(action.payload.taskId);
      }
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId
          ? { ...g, tasks: g.tasks.filter((t) => t.id !== action.payload.taskId) }
          : g
      );
      return { ...state, groups };
    }

    case 'TOGGLE_TASK': {
      const { taskId, dateKey, subtaskIds } = action.payload;
      const completed = { ...state.completedTasks };
      if (!completed[dateKey]) completed[dateKey] = {};
      completed[dateKey] = { ...completed[dateKey] };
      const newVal = !completed[dateKey][taskId];
      completed[dateKey][taskId] = newVal;
      // When completing a task, also complete all its subtasks
      if (newVal && subtaskIds) {
        subtaskIds.forEach((id) => {
          completed[dateKey][id] = true;
        });
      }
      return { ...state, completedTasks: completed };
    }

    case 'ADD_WEEKLY_GOAL': {
      const goal = {
        id: uuid(),
        text: action.payload.text,
        icon: action.payload.icon || '🎯',
        weekKey: action.payload.weekKey,
        tasks: action.payload.tasks || [],
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

    case 'DELETE_WEEKLY_GOAL': {
      const weeklyGoals = state.weeklyGoals.filter((g) => g.id !== action.payload);
      return { ...state, weeklyGoals };
    }

    case 'ADD_GOAL_TASK': {
      const goalTask = {
        id: uuid(),
        name: action.payload.name,
        description: action.payload.description || '',
        subtasks: action.payload.subtasks || [],
        completed: false,
      };
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId ? { ...g, tasks: [...(g.tasks || []), goalTask] } : g
      );
      return { ...state, weeklyGoals };
    }

    case 'UPDATE_GOAL_TASK': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId
          ? {
              ...g,
              tasks: (g.tasks || []).map((t) =>
                t.id === action.payload.taskId ? { ...t, ...action.payload.updates } : t
              ),
            }
          : g
      );
      return { ...state, weeklyGoals };
    }

    case 'DELETE_GOAL_TASK': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId
          ? { ...g, tasks: (g.tasks || []).filter((t) => t.id !== action.payload.taskId) }
          : g
      );
      return { ...state, weeklyGoals };
    }

    case 'TOGGLE_GOAL_TASK': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId
          ? {
              ...g,
              tasks: (g.tasks || []).map((t) =>
                t.id === action.payload.taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : g
      );
      return { ...state, weeklyGoals };
    }

    case 'UPDATE_SETTINGS': {
      const settings = { ...(state.settings || {}), ...action.payload };
      return { ...state, settings };
    }

    case 'TOGGLE_GOAL_SUBTASK': {
      const { goalId, taskId, subtaskId } = action.payload;
      const weeklyGoals = state.weeklyGoals.map((g) => {
        if (g.id !== goalId) return g;
        const tasks = (g.tasks || []).map((t) => {
          if (t.id !== taskId) return t;
          const subtasks = (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allDone = subtasks.length > 0 && subtasks.every((st) => st.completed);
          return { ...t, subtasks, completed: allDone };
        });
        return { ...g, tasks };
      });
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
