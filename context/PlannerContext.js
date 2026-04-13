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
      const templateTasks = (action.payload.templateTasks || []).map((t, tIdx) => ({
        id: uuid(),
        name: t.name,
        description: t.description || '',
        subtasks: (t.subtasks || []).map((st, i) => ({
          id: `st-${Date.now()}-${tIdx}-${i}`,
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
      const newSubVal = completed[dateKey][subtaskId];
      // Auto-complete parent task when all subtasks are done
      if (taskId && allSubtaskIds) {
        const allDone = allSubtaskIds.every((id) => completed[dateKey][id]);
        completed[dateKey][taskId] = allDone;
      }
      // Bidirectional sync: propagate to linked weekly goal subtask
      let toggleSubGoals = state.weeklyGoals;
      const subDaily = state.groups.flatMap((g) => g.tasks).find((t) => t.id === taskId);
      if (subDaily?.linkedWeeklyTaskId && subDaily?.subtaskIdMap) {
        const weeklyStId = Object.entries(subDaily.subtaskIdMap).find(
          ([, dId]) => dId === subtaskId
        )?.[0];
        if (weeklyStId) {
          toggleSubGoals = toggleSubGoals.map((g) => {
            if (g.id !== subDaily.linkedWeeklyGoalId) return g;
            return {
              ...g,
              tasks: (g.tasks || []).map((t) => {
                if (t.id !== subDaily.linkedWeeklyTaskId) return t;
                const subtasks = (t.subtasks || []).map((st) =>
                  st.id === weeklyStId ? { ...st, completed: newSubVal } : st
                );
                const allStDone = subtasks.length > 0 && subtasks.every((st) => st.completed);
                return { ...t, subtasks, completed: allStDone };
              }),
            };
          });
        }
      }
      return { ...state, completedTasks: completed, weeklyGoals: toggleSubGoals };
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

      // Clean up weekly goal task link if this was a linked task
      let delTaskGoals = state.weeklyGoals;
      if (deletedTask?.linkedWeeklyTaskId) {
        delTaskGoals = delTaskGoals.map((g) =>
          g.id === deletedTask.linkedWeeklyGoalId
            ? {
                ...g,
                tasks: (g.tasks || []).map((t) =>
                  t.id === deletedTask.linkedWeeklyTaskId
                    ? { ...t, linkedDailyGroupId: undefined, linkedDailyTaskId: undefined, linkedDateKey: undefined }
                    : t
                ),
              }
            : g
        );
      }

      return { ...state, groups, weeklyGoals: delTaskGoals };
    }

    case 'MOVE_TASK': {
      const { groupId: srcGroupId, taskId: moveTaskId, targetDate, sourceDate } = action.payload;

      const srcGroup = state.groups.find((g) => g.id === srcGroupId);
      const task = srcGroup?.tasks.find((t) => t.id === moveTaskId);
      if (!task || !srcGroup) return state;

      // Cancel alarm on moved task
      if (task.alarm?.enabled) cancelTaskAlarm(moveTaskId);

      // Build moved task as a one-off on the target date
      const movedTask = {
        id: uuid(),
        name: task.name,
        description: task.description || '',
        subtasks: (task.subtasks || []).map((st) => ({ id: `st-${Date.now()}-${Math.random()}`, name: st.name })),
        createdDate: targetDate,
        recurrence: 'once',
        alarm: { enabled: false, hour: task.alarm?.hour ?? 8, minute: task.alarm?.minute ?? 0 },
        linkedWeeklyGoalId: task.linkedWeeklyGoalId || null,
      };

      // Find a group with the same name that's visible on the target date
      const isVisibleOnDate = (g, date) => {
        if (g.hiddenRanges?.some((r) => date >= r.start && (!r.end || date < r.end))) return false;
        if (g.recurrence?.type === 'daily') return true;
        return g.createdDate === date;
      };
      const targetGroup = state.groups.find(
        (g) => g.name === srcGroup.name && isVisibleOnDate(g, targetDate)
      );

      let groups = state.groups;

      // Remove task from source: soft-delete for daily tasks, hard-delete for one-off
      const isDailyTask = !task.recurrence || task.recurrence === 'daily';
      const isDailyGroup = srcGroup.recurrence?.type === 'daily';
      if (isDailyTask && isDailyGroup && sourceDate) {
        groups = groups.map((g) =>
          g.id === srcGroupId
            ? {
                ...g,
                tasks: g.tasks.map((t) =>
                  t.id === moveTaskId
                    ? { ...t, hiddenRanges: [...(t.hiddenRanges || []), { start: sourceDate }] }
                    : t
                ),
              }
            : g
        );
      } else {
        groups = groups.map((g) =>
          g.id === srcGroupId
            ? { ...g, tasks: g.tasks.filter((t) => t.id !== moveTaskId) }
            : g
        );
      }

      // Add to target group, or create a new one-off group
      if (targetGroup) {
        groups = groups.map((g) =>
          g.id === targetGroup.id ? { ...g, tasks: [...g.tasks, movedTask] } : g
        );
      } else {
        const newGroup = {
          id: uuid(),
          name: srcGroup.name,
          description: srcGroup.description || '',
          icon: srcGroup.icon || 'sun',
          recurrence: { type: 'once' },
          createdDate: targetDate,
          tasks: [movedTask],
          order: groups.length,
        };
        groups = [...groups, newGroup];
      }

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
      // Bidirectional sync: propagate to linked weekly goal task
      let toggleTaskGoals = state.weeklyGoals;
      const toggledDaily = state.groups.flatMap((g) => g.tasks).find((t) => t.id === taskId);
      if (toggledDaily?.linkedWeeklyTaskId) {
        toggleTaskGoals = toggleTaskGoals.map((g) =>
          g.id === toggledDaily.linkedWeeklyGoalId
            ? {
                ...g,
                tasks: (g.tasks || []).map((t) =>
                  t.id === toggledDaily.linkedWeeklyTaskId
                    ? {
                        ...t,
                        completed: newVal,
                        subtasks: newVal
                          ? (t.subtasks || []).map((st) => ({ ...st, completed: true }))
                          : t.subtasks,
                      }
                    : t
                ),
              }
            : g
        );
      }
      return { ...state, completedTasks: completed, weeklyGoals: toggleTaskGoals };
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
      const delWgGoal = state.weeklyGoals.find((g) => g.id === action.payload);
      const delWgGoals = state.weeklyGoals.filter((g) => g.id !== action.payload);

      // Clean up all daily task links for tasks in this goal
      let delWgGroups = state.groups;
      if (delWgGoal) {
        const linkedIds = new Set(
          (delWgGoal.tasks || []).filter((t) => t.linkedDailyTaskId).map((t) => t.linkedDailyTaskId)
        );
        if (linkedIds.size > 0) {
          delWgGroups = delWgGroups.map((g) => ({
            ...g,
            tasks: g.tasks.map((t) =>
              linkedIds.has(t.id)
                ? { ...t, linkedWeeklyGoalId: null, linkedWeeklyTaskId: undefined, subtaskIdMap: undefined }
                : t
            ),
          }));
        }
      }

      return { ...state, weeklyGoals: delWgGoals, groups: delWgGroups };
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
      const delGtGoal = state.weeklyGoals.find((g) => g.id === action.payload.goalId);
      const delGtTask = delGtGoal?.tasks?.find((t) => t.id === action.payload.taskId);

      const delGtGoals = state.weeklyGoals.map((g) =>
        g.id === action.payload.goalId
          ? { ...g, tasks: (g.tasks || []).filter((t) => t.id !== action.payload.taskId) }
          : g
      );

      // Clean up daily task link
      let delGtGroups = state.groups;
      if (delGtTask?.linkedDailyTaskId) {
        delGtGroups = delGtGroups.map((g) =>
          g.id === delGtTask.linkedDailyGroupId
            ? {
                ...g,
                tasks: g.tasks.map((t) =>
                  t.id === delGtTask.linkedDailyTaskId
                    ? { ...t, linkedWeeklyGoalId: null, linkedWeeklyTaskId: undefined, subtaskIdMap: undefined }
                    : t
                ),
              }
            : g
        );
      }

      return { ...state, weeklyGoals: delGtGoals, groups: delGtGroups };
    }

    case 'TOGGLE_GOAL_TASK': {
      const { goalId: tgtGoalId, taskId: tgtTaskId } = action.payload;
      const tgtGoal = state.weeklyGoals.find((g) => g.id === tgtGoalId);
      const tgtGoalTask = tgtGoal?.tasks?.find((t) => t.id === tgtTaskId);
      if (!tgtGoalTask) return state;
      const tgtNewVal = !tgtGoalTask.completed;

      const tgtWeeklyGoals = state.weeklyGoals.map((g) =>
        g.id === tgtGoalId
          ? {
              ...g,
              tasks: (g.tasks || []).map((t) => {
                if (t.id !== tgtTaskId) return t;
                const updated = { ...t, completed: tgtNewVal };
                // For linked tasks, auto-complete subtasks when checking
                if (tgtNewVal && t.linkedDailyTaskId) {
                  updated.subtasks = (t.subtasks || []).map((st) => ({ ...st, completed: true }));
                }
                return updated;
              }),
            }
          : g
      );

      // Bidirectional sync: propagate to linked daily task
      let tgtCompleted = state.completedTasks;
      if (tgtGoalTask.linkedDailyTaskId && tgtGoalTask.linkedDateKey) {
        const dk = tgtGoalTask.linkedDateKey;
        tgtCompleted = { ...tgtCompleted };
        if (!tgtCompleted[dk]) tgtCompleted[dk] = {};
        tgtCompleted[dk] = { ...tgtCompleted[dk] };
        tgtCompleted[dk][tgtGoalTask.linkedDailyTaskId] = tgtNewVal;
        if (tgtNewVal) {
          const tgtDailyTask = state.groups.flatMap((g) => g.tasks).find((t) => t.id === tgtGoalTask.linkedDailyTaskId);
          if (tgtDailyTask) {
            (tgtDailyTask.subtasks || []).forEach((st) => {
              tgtCompleted[dk][st.id] = true;
            });
          }
        }
      }

      return { ...state, weeklyGoals: tgtWeeklyGoals, completedTasks: tgtCompleted };
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

    case 'ADD_LINKED_TASK': {
      const { groupId, weeklyGoalId, weeklyTaskId, createdDate } = action.payload;
      const goal = state.weeklyGoals.find((g) => g.id === weeklyGoalId);
      const goalTask = goal?.tasks?.find((t) => t.id === weeklyTaskId);
      if (!goalTask) return state;

      const dailyTaskId = uuid();
      const subtaskIdMap = {};
      const dailySubtasks = (goalTask.subtasks || []).map((st) => {
        const newId = `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        subtaskIdMap[st.id] = newId;
        return { id: newId, name: st.name };
      });

      const newTask = {
        id: dailyTaskId,
        name: goalTask.name,
        description: goalTask.description || '',
        subtasks: dailySubtasks,
        createdDate,
        recurrence: 'once',
        alarm: { enabled: false, hour: 8, minute: 0 },
        linkedWeeklyGoalId: weeklyGoalId,
        linkedWeeklyTaskId: weeklyTaskId,
        subtaskIdMap,
      };

      const addLinkedGroups = state.groups.map((g) =>
        g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g
      );

      const addLinkedGoals = state.weeklyGoals.map((g) =>
        g.id === weeklyGoalId
          ? {
              ...g,
              tasks: (g.tasks || []).map((t) =>
                t.id === weeklyTaskId
                  ? { ...t, linkedDailyGroupId: groupId, linkedDailyTaskId: dailyTaskId, linkedDateKey: createdDate }
                  : t
              ),
            }
          : g
      );

      // Sync existing completion state from weekly goal task
      let addLinkedCompleted = state.completedTasks;
      if (goalTask.completed) {
        addLinkedCompleted = { ...addLinkedCompleted };
        if (!addLinkedCompleted[createdDate]) addLinkedCompleted[createdDate] = {};
        addLinkedCompleted[createdDate] = { ...addLinkedCompleted[createdDate] };
        addLinkedCompleted[createdDate][dailyTaskId] = true;
        dailySubtasks.forEach((st) => {
          addLinkedCompleted[createdDate][st.id] = true;
        });
      } else if ((goalTask.subtasks || []).some((st) => st.completed)) {
        addLinkedCompleted = { ...addLinkedCompleted };
        if (!addLinkedCompleted[createdDate]) addLinkedCompleted[createdDate] = {};
        addLinkedCompleted[createdDate] = { ...addLinkedCompleted[createdDate] };
        (goalTask.subtasks || []).forEach((st) => {
          if (st.completed && subtaskIdMap[st.id]) {
            addLinkedCompleted[createdDate][subtaskIdMap[st.id]] = true;
          }
        });
      }

      return { ...state, groups: addLinkedGroups, weeklyGoals: addLinkedGoals, completedTasks: addLinkedCompleted };
    }

    case 'TOGGLE_GOAL_SUBTASK': {
      const { goalId, taskId, subtaskId } = action.payload;
      const gsGoal = state.weeklyGoals.find((g) => g.id === goalId);
      const gsTask = gsGoal?.tasks?.find((t) => t.id === taskId);
      const gsSub = gsTask?.subtasks?.find((st) => st.id === subtaskId);
      const gsNewSubVal = gsSub ? !gsSub.completed : false;

      const gsWeeklyGoals = state.weeklyGoals.map((g) => {
        if (g.id !== goalId) return g;
        const tasks = (g.tasks || []).map((t) => {
          if (t.id !== taskId) return t;
          const subtasks = (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: gsNewSubVal } : st
          );
          const allDone = subtasks.length > 0 && subtasks.every((st) => st.completed);
          return { ...t, subtasks, completed: allDone };
        });
        return { ...g, tasks };
      });

      // Bidirectional sync: propagate to linked daily subtask
      let gsCompleted = state.completedTasks;
      if (gsTask?.linkedDailyTaskId && gsTask?.linkedDateKey) {
        const gsDailyTask = state.groups.flatMap((g) => g.tasks).find((t) => t.id === gsTask.linkedDailyTaskId);
        if (gsDailyTask?.subtaskIdMap) {
          const dailyStId = gsDailyTask.subtaskIdMap[subtaskId];
          if (dailyStId) {
            const dk = gsTask.linkedDateKey;
            gsCompleted = { ...gsCompleted };
            if (!gsCompleted[dk]) gsCompleted[dk] = {};
            gsCompleted[dk] = { ...gsCompleted[dk] };
            gsCompleted[dk][dailyStId] = gsNewSubVal;
            // Auto-complete daily parent if all subtasks done
            const allDailyStIds = (gsDailyTask.subtasks || []).map((st) => st.id);
            const allDone = allDailyStIds.every((id) => gsCompleted[dk][id]);
            gsCompleted[dk][gsDailyTask.id] = allDone;
          }
        }
      }

      return { ...state, weeklyGoals: gsWeeklyGoals, completedTasks: gsCompleted };
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
