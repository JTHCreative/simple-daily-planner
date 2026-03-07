import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useWeeklyGoals, useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';
import WeeklyGoalForm from './WeeklyGoalForm';
import WeeklyTaskForm from './WeeklyTaskForm';
import TaskArrange from './TaskArrange';
import CompletedBanner from './CompletedBanner';

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export default function WeeklyGoals({ selectedDate }) {
  const colors = useTheme();
  const weeklyGoals = useWeeklyGoals();
  const dispatch = useDispatch();
  const [expandedGoals, setExpandedGoals] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

  // Goal form state
  const [goalFormVisible, setGoalFormVisible] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  // Task form state
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [taskFormGoalId, setTaskFormGoalId] = useState(null);
  const [taskFormGoalName, setTaskFormGoalName] = useState('');
  const [editTask, setEditTask] = useState(null);

  // Task arrange state
  const [taskArrangeVisible, setTaskArrangeVisible] = useState(false);
  const [taskArrangeGoalId, setTaskArrangeGoalId] = useState(null);
  const [taskArrangeGoalName, setTaskArrangeGoalName] = useState('');

  // Quick-add goal
  const [newGoal, setNewGoal] = useState('');

  const weekKey = useMemo(() => getWeekKey(selectedDate), [selectedDate]);

  const goals = useMemo(
    () => weeklyGoals.filter((g) => g.weekKey === weekKey),
    [weeklyGoals, weekKey]
  );

  // Count completed tasks across all goals
  const { totalTasks, completedTaskCount } = useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const g of goals) {
      const tasks = g.tasks || [];
      total += tasks.length;
      for (const t of tasks) {
        if (t.completed) completed++;
      }
    }
    return { totalTasks: total, completedTaskCount: completed };
  }, [goals]);

  const addGoal = useCallback(() => {
    if (!newGoal.trim()) return;
    dispatch({ type: 'ADD_WEEKLY_GOAL', payload: { text: newGoal.trim(), weekKey } });
    setNewGoal('');
  }, [newGoal, dispatch, weekKey]);

  const toggleGoalExpand = useCallback((goalId) => {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  }, []);

  const toggleTaskExpand = useCallback((taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  const openEditGoal = useCallback((goal) => {
    setEditGoal(goal);
    setGoalFormVisible(true);
  }, []);

  const openAddTask = useCallback((goal) => {
    setTaskFormGoalId(goal.id);
    setTaskFormGoalName(goal.text);
    setEditTask(null);
    setTaskFormVisible(true);
  }, []);

  const openTaskArrange = useCallback((goal) => {
    setTaskArrangeGoalId(goal.id);
    setTaskArrangeGoalName(goal.text);
    setTaskArrangeVisible(true);
  }, []);

  const taskArrangeTasks = useMemo(
    () => weeklyGoals.find((g) => g.id === taskArrangeGoalId)?.tasks || [],
    [weeklyGoals, taskArrangeGoalId]
  );

  const openEditTask = useCallback((goal, task) => {
    setTaskFormGoalId(goal.id);
    setTaskFormGoalName(goal.text);
    setEditTask(task);
    setTaskFormVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Goals</Text>
        <View style={[styles.progressBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {completedTaskCount}/{totalTasks}
          </Text>
        </View>
      </View>

      {goals.map((goal) => {
        const tasks = goal.tasks || [];
        const hasTasks = tasks.length > 0;
        const isExpanded = expandedGoals[goal.id];
        const tasksDone = tasks.filter((t) => t.completed).length;
        const allTasksDone = hasTasks && tasksDone === tasks.length;
        const goalIcon = goal.icon || '🎯';

        return (
          <View
            key={goal.id}
            style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <CompletedBanner isCompleted={allTasksDone} />

            {/* Goal Header */}
            <Pressable
              style={({ pressed }) => [styles.goalHeader, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => toggleGoalExpand(goal.id)}
              onLongPress={() => openEditGoal(goal)}
              delayLongPress={400}
            >
              <View style={[styles.goalIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.goalIconText}>{goalIcon}</Text>
              </View>
              <View style={styles.goalInfo}>
                <Text
                  style={[
                    styles.goalText,
                    {
                      color: goal.completed ? colors.textSecondary : colors.text,
                      textDecorationLine: goal.completed ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {goal.text}
                </Text>
                {hasTasks && !isExpanded && (
                  <Text style={[styles.goalMeta, { color: colors.textMuted }]}>
                    {tasksDone}/{tasks.length} tasks
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.chevron,
                  isExpanded ? styles.chevronUp : styles.chevronDown,
                  { borderColor: colors.textMuted },
                ]}
              />
            </Pressable>

            {/* Expanded Tasks */}
            {isExpanded && (
              <View style={[styles.taskList, { borderTopColor: colors.border }]}>
                {tasks.map((task) => {
                  const subtasks = task.subtasks || [];
                  const hasSubtasks = subtasks.length > 0;
                  const isTaskExpanded = expandedTasks[task.id];
                  const stDone = subtasks.filter((st) => st.completed).length;

                  return (
                    <View key={task.id}>
                      {/* Task Row */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.taskRow,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                        onPress={() =>
                          dispatch({
                            type: 'TOGGLE_GOAL_TASK',
                            payload: { goalId: goal.id, taskId: task.id },
                          })
                        }
                        onLongPress={() => openEditTask(goal, task)}
                        delayLongPress={400}
                      >
                        <View
                          style={[
                            styles.taskCheck,
                            {
                              borderColor: task.completed ? colors.primary : colors.border,
                              backgroundColor: task.completed ? colors.primary : 'transparent',
                            },
                          ]}
                        >
                          {task.completed && <Text style={styles.taskCheckmark}>✓</Text>}
                        </View>
                        <View style={styles.taskInfo}>
                          <Text
                            style={[
                              styles.taskName,
                              {
                                color: task.completed ? colors.textSecondary : colors.text,
                                textDecorationLine: task.completed ? 'line-through' : 'none',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {task.name}
                          </Text>
                          {task.description && !isTaskExpanded ? (
                            <Text style={[styles.taskDesc, { color: colors.textMuted }]} numberOfLines={1}>
                              {task.description}
                            </Text>
                          ) : null}
                          {hasSubtasks && !isTaskExpanded && (
                            <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>
                              {stDone}/{subtasks.length} sub-tasks
                            </Text>
                          )}
                        </View>
                        {hasSubtasks && (
                          <Pressable
                            onPress={() => toggleTaskExpand(task.id)}
                            style={styles.expandBtn}
                            hitSlop={8}
                          >
                            <View
                              style={[
                                styles.chevron,
                                isTaskExpanded ? styles.chevronUp : styles.chevronDown,
                                { borderColor: colors.textMuted },
                              ]}
                            />
                          </Pressable>
                        )}
                      </Pressable>

                      {/* Expanded Subtasks */}
                      {hasSubtasks && isTaskExpanded && (
                        <View style={styles.subtaskList}>
                          {subtasks.map((st) => (
                            <Pressable
                              key={st.id}
                              onPress={() =>
                                dispatch({
                                  type: 'TOGGLE_GOAL_SUBTASK',
                                  payload: { goalId: goal.id, taskId: task.id, subtaskId: st.id },
                                })
                              }
                              style={({ pressed }) => [
                                styles.subtaskRow,
                                { opacity: pressed ? 0.7 : 1 },
                              ]}
                            >
                              <View
                                style={[
                                  styles.subtaskCheck,
                                  {
                                    borderColor: st.completed ? colors.primary : colors.border,
                                    backgroundColor: st.completed ? colors.primary : 'transparent',
                                  },
                                ]}
                              >
                                {st.completed && <Text style={styles.subtaskCheckmark}>✓</Text>}
                              </View>
                              <Text
                                style={[
                                  styles.subtaskName,
                                  {
                                    color: st.completed ? colors.textSecondary : colors.text,
                                    textDecorationLine: st.completed ? 'line-through' : 'none',
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {st.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add Task / Arrange buttons at bottom of expanded section */}
                <View style={[styles.taskActions, { borderTopColor: hasTasks ? colors.border : 'transparent' }]}>
                  <TouchableOpacity
                    style={styles.addTaskRow}
                    onPress={() => openAddTask(goal)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.addTaskIcon, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.addTaskIconText, { color: colors.primary }]}>+</Text>
                    </View>
                    <Text style={[styles.addTaskLabel, { color: colors.primary }]}>Add Task</Text>
                  </TouchableOpacity>
                  {tasks.length >= 2 && (
                    <TouchableOpacity
                      style={styles.arrangeTaskRow}
                      onPress={() => openTaskArrange(goal)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.arrangeTaskLabel, { color: colors.textMuted }]}>↕ Reorder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Quick-add goal input */}
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={newGoal}
          onChangeText={setNewGoal}
          placeholder="Add a weekly goal..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary, opacity: newGoal.trim() ? 1 : 0.5 }]}
          onPress={addGoal}
          disabled={!newGoal.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Long-press a goal or task to edit it
      </Text>

      {/* Goal Edit Form */}
      <WeeklyGoalForm
        visible={goalFormVisible}
        onClose={() => setGoalFormVisible(false)}
        editGoal={editGoal}
        weekKey={weekKey}
      />

      {/* Task Edit Form */}
      <WeeklyTaskForm
        visible={taskFormVisible}
        onClose={() => setTaskFormVisible(false)}
        goalId={taskFormGoalId}
        goalName={taskFormGoalName}
        editTask={editTask}
      />

      {/* Task Arrange */}
      <TaskArrange
        visible={taskArrangeVisible}
        onClose={() => setTaskArrangeVisible(false)}
        tasks={taskArrangeTasks}
        title={`Arrange Tasks — ${taskArrangeGoalName}`}
        mode="goal"
        goalId={taskArrangeGoalId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 100,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Goal card
  goalCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconText: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
    gap: 2,
  },
  goalText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalMeta: {
    fontSize: 12,
  },
  // Task list
  taskList: {
    borderTopWidth: 1,
    paddingVertical: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskDesc: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  subtaskCount: {
    fontSize: 11,
  },
  expandBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Subtask list
  subtaskList: {
    paddingLeft: 48,
    paddingRight: 16,
    paddingBottom: 8,
    gap: 2,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  subtaskCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  subtaskName: {
    fontSize: 13,
    flex: 1,
  },
  // Add task row
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  arrangeTaskRow: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  arrangeTaskLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  addTaskIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskIconText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: -1,
  },
  addTaskLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Shared
  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  chevronDown: {
    transform: [{ rotate: '135deg' }],
    marginBottom: 3,
  },
  chevronUp: {
    transform: [{ rotate: '-45deg' }],
    marginTop: 3,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginTop: -1,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
