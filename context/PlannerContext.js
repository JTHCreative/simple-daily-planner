import 'react-native-get-random-values';
import { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import { loadData, saveData } from '../utils/storage';
import { v4 as uuid } from 'uuid';
import { scheduleTaskAlarm, cancelTaskAlarm } from '../utils/notifications';

// Separate contexts so components only re-render when their slice changes
const GroupsContext = createContext();
const CompletionContext = createContext();
const WeeklyGoalsContext = createContext();
const SettingsContext = createContext();
const TemplatesContext = createContext();
const DispatchContext = createContext();

const DEFAULT_STATE = {
  groups: [],
  completedTasks: {},
  weeklyGoals: [],
  templates: [],
  settings: {
    userName: '',
    themeMode: 'system', // 'system' | 'light' | 'dark'
    timezone: null, // null = auto-detect from device
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...DEFAULT_STATE, ...action.payload };

    case 'ADD_GROUP': {
      const createdDate = action.payload.createdDate || new Date().toISOString().split('T')[0];
      const templateTasks = (action.payload.templateTasks || []).map((t) => ({
        id: uuid(),
        name: t.name,
        description: t.description || '',
        subtasks: (t.subtasks || []).map((st, i) => ({
          id: `st-${Date.now()}-${i}`,
          name: st.name,
        })),
        createdDate,
        recurrence: t.recurrence || 'daily',
        alarm: { enabled: false, hour: 8, minute: 0 },
      }));
      const newGroup = {
        id: uuid(),
        name: action.payload.name,
        description: action.payload.description || '',
        icon: action.payload.icon || 'sun',
        recurrence: action.payload.recurrence || { type: 'once' },
        createdDate,
        tasks: templateTasks,
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
      // Support both legacy string payload and new object payload
      const { groupId: delGroupId, deletedDate: groupDeletedDate } =
        typeof action.payload === 'string'
          ? { groupId: action.payload, deletedDate: null }
          : action.payload;

      const deletedGroup = state.groups.find((g) => g.id === delGroupId);

      // Cancel alarms for all tasks in the deleted group
      if (deletedGroup) {
        deletedGroup.tasks.forEach((t) => {
          if (t.alarm?.enabled) cancelTaskAlarm(t.id);
        });
      }

      const isDailyGroup = deletedGroup?.recurrence?.type === 'daily';

      if (isDailyGroup && groupDeletedDate) {
        // Soft-delete: add a hidden range starting from the deleted date
        const groups = state.groups.map((g) =>
          g.id === delGroupId
            ? { ...g, hiddenRanges: [...(g.hiddenRanges || []), { start: groupDeletedDate }] }
            : g
        );
        return { ...state, groups };
      }

      // Hard-delete one-off groups
      const groups = state.groups.filter((g) => g.id !== delGroupId);
      return { ...state, groups };
    }

    case 'REORDER_GROUPS':
      return { ...state, groups: action.payload };

    case 'REORDER_TASKS': {
      const groups = state.groups.map((g) =>
        g.id === action.payload.groupId ? { ...g, tasks: action.payload.tasks } : g
      );
      return { ...state, groups };
    }

    case 'REORDER_GOAL_TASKS': {
      const weeklyGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId ? { ...g, tasks: action.payload.tasks } : g
      );
      return { ...state, weeklyGoals };
    }

    case 'ADD_TASK': {
      const targetGroup = state.groups.find((g) => g.id === action.payload.groupId);
      const newName = action.payload.name.trim().toLowerCase();

      // Check for a soft-deleted task with the same name — revive it instead of duplicating
      const isHidden = (t) =>
        t.hiddenRanges?.length > 0 && !t.hiddenRanges[t.hiddenRanges.length - 1].end;
      const existingTask = targetGroup?.tasks.find(
        (t) => isHidden(t) && t.name.trim().toLowerCase() === newName
      );

      if (existingTask) {
        const revivedDate = action.payload.createdDate || new Date().toISOString().split('T')[0];
        const alarm = action.payload.alarm || existingTask.alarm || { enabled: false, hour: 8, minute: 0 };
        if (alarm.enabled) {
          scheduleTaskAlarm(existingTask.id, action.payload.name, alarm.hour, alarm.minute);
        }
        // Close the open-ended hidden range so the task is visible again from today
        const closedRanges = (existingTask.hiddenRanges || []).map((r, i) =>
          i === existingTask.hiddenRanges.length - 1 && !r.end
            ? { ...r, end: revivedDate }
            : r
        );
        const groups = state.groups.map((g) =>
          g.id === action.payload.groupId
            ? {
                ...g,
                tasks: g.tasks.map((t) =>
                  t.id === existingTask.id
                    ? {
                        ...t,
                        name: action.payload.name,
                        description: action.payload.description || '',
                        subtasks: action.payload.subtasks || t.subtasks,
                        recurrence: action.payload.recurrence || t.recurrence,
                        alarm,
                        linkedWeeklyGoalId: action.payload.linkedWeeklyGoalId || null,
                        hiddenRanges: closedRanges,
                      }
                    : t
                ),
              }
            : g
        );
        return { ...state, groups };
      }

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
        linkedWeeklyGoalId: action.payload.linkedWeeklyGoalId || null,
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
      const { groupId: delTaskGroupId, taskId: delTaskId, deletedDate: taskDeletedDate } = action.payload;

      const delTaskGroup = state.groups.find((g) => g.id === delTaskGroupId);
      const deletedTask = delTaskGroup?.tasks.find((t) => t.id === delTaskId);

      // Cancel alarm if the deleted task had one
      if (deletedTask?.alarm?.enabled) {
        cancelTaskAlarm(delTaskId);
      }

      const isDailyTask = !deletedTask?.recurrence || deletedTask?.recurrence === 'daily';
      const isDailyGroup = delTaskGroup?.recurrence?.type === 'daily';

      if (isDailyTask && isDailyGroup && taskDeletedDate) {
        // Soft-delete: add a hidden range starting from the deleted date
        const groups = state.groups.map((g) =>
          g.id === delTaskGroupId
            ? {
                ...g,
                tasks: g.tasks.map((t) =>
                  t.id === delTaskId
                    ? { ...t, hiddenRanges: [...(t.hiddenRanges || []), { start: taskDeletedDate }] }
                    : t
                ),
              }
            : g
        );
        return { ...state, groups };
      }

      // Hard-delete one-off tasks
      const groups = state.groups.map((g) =>
        g.id === delTaskGroupId
          ? { ...g, tasks: g.tasks.filter((t) => t.id !== delTaskId) }
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

    case 'SAVE_TEMPLATE': {
      const template = {
        id: uuid(),
        name: action.payload.name,
        description: action.payload.description || '',
        icon: action.payload.icon || 'sun',
        recurrence: action.payload.recurrence || { type: 'once' },
        tasks: (action.payload.tasks || []).map((t) => ({
          name: t.name,
          description: t.description || '',
          subtasks: (t.subtasks || []).map((st) => ({ name: st.name })),
          recurrence: t.recurrence || 'daily',
        })),
        createdAt: new Date().toISOString(),
      };
      return { ...state, templates: [...(state.templates || []), template] };
    }

    case 'DELETE_TEMPLATE': {
      const templates = (state.templates || []).filter((t) => t.id !== action.payload);
      return { ...state, templates };
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

    case 'PURGE_STALE_DELETED': {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const cutoff = oneYearAgo.toISOString().split('T')[0];

      // Permanently remove tasks/groups that have been hidden (open-ended) for over a year
      const isStaleHidden = (item) => {
        const ranges = item.hiddenRanges;
        if (!ranges?.length) return false;
        const last = ranges[ranges.length - 1];
        return !last.end && last.start < cutoff;
      };

      const groups = state.groups
        .filter((g) => !isStaleHidden(g))
        .map((g) => ({
          ...g,
          tasks: g.tasks.filter((t) => !isStaleHidden(t)),
        }));
      return { ...state, groups };
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
      // Purge soft-deleted tasks/groups older than 1 year
      dispatch({ type: 'PURGE_STALE_DELETED' });
    });
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      saveData(state);
    }
  }, [state]);

  // Memoize each slice so providers only trigger re-renders when their data changes
  const groups = state.groups;
  const completedTasks = state.completedTasks;
  const weeklyGoals = state.weeklyGoals;
  const settings = state.settings;
  const templates = state.templates || [];

  return (
    <DispatchContext.Provider value={dispatch}>
      <GroupsContext.Provider value={groups}>
        <CompletionContext.Provider value={completedTasks}>
          <WeeklyGoalsContext.Provider value={weeklyGoals}>
            <SettingsContext.Provider value={settings}>
              <TemplatesContext.Provider value={templates}>
                {children}
              </TemplatesContext.Provider>
            </SettingsContext.Provider>
          </WeeklyGoalsContext.Provider>
        </CompletionContext.Provider>
      </GroupsContext.Provider>
    </DispatchContext.Provider>
  );
}

// Granular hooks — components subscribe only to the slice they need
export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (ctx === undefined) throw new Error('useGroups must be used within PlannerProvider');
  return ctx;
}

export function useCompletedTasks() {
  const ctx = useContext(CompletionContext);
  if (ctx === undefined) throw new Error('useCompletedTasks must be used within PlannerProvider');
  return ctx;
}

export function useWeeklyGoals() {
  const ctx = useContext(WeeklyGoalsContext);
  if (ctx === undefined) throw new Error('useWeeklyGoals must be used within PlannerProvider');
  return ctx;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (ctx === undefined) throw new Error('useSettings must be used within PlannerProvider');
  return ctx;
}

export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (ctx === undefined) throw new Error('useTemplates must be used within PlannerProvider');
  return ctx;
}

export function useDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch must be used within PlannerProvider');
  return ctx;
}

// Keep backward-compatible hook that returns full state + dispatch
export function usePlanner() {
  const groups = useContext(GroupsContext);
  const completedTasks = useContext(CompletionContext);
  const weeklyGoals = useContext(WeeklyGoalsContext);
  const settings = useContext(SettingsContext);
  const templates = useContext(TemplatesContext);
  const dispatch = useContext(DispatchContext);
  if (dispatch === undefined) throw new Error('usePlanner must be used within PlannerProvider');
  return {
    state: { groups, completedTasks, weeklyGoals, settings, templates },
    dispatch,
  };
}
