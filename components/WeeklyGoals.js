import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';
import BottomSheet from './BottomSheet';

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export default function WeeklyGoals({ selectedDate }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();
  const [newGoal, setNewGoal] = useState('');
  const [expandedGoals, setExpandedGoals] = useState({});
  const [editGoal, setEditGoal] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const weekKey = getWeekKey(selectedDate);
  const goals = state.weeklyGoals.filter((g) => g.weekKey === weekKey);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    dispatch({ type: 'ADD_WEEKLY_GOAL', payload: { text: newGoal.trim(), weekKey } });
    setNewGoal('');
  };

  const toggleExpand = (goalId) => {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const openEdit = (goal) => {
    setEditGoal(goal);
    setEditText(goal.text);
    setEditSubtasks(goal.subtasks || []);
    setNewSubtask('');
  };

  const closeEdit = () => {
    setEditGoal(null);
  };

  const addEditSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    setEditSubtasks((prev) => [
      ...prev,
      { id: `gst-${Date.now()}-${prev.length}`, name: text, completed: false },
    ]);
    setNewSubtask('');
  };

  const removeEditSubtask = (id) => {
    setEditSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const saveEdit = () => {
    if (!editGoal || !editText.trim()) return;
    dispatch({
      type: 'UPDATE_WEEKLY_GOAL',
      payload: { id: editGoal.id, updates: { text: editText.trim(), subtasks: editSubtasks } },
    });
    closeEdit();
  };

  const deleteEdit = () => {
    if (!editGoal) return;
    dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: editGoal.id });
    closeEdit();
  };

  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Goals</Text>
        <View style={[styles.progressBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {completedCount}/{goals.length}
          </Text>
        </View>
      </View>

      {goals.length > 0 && (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {goals.map((goal) => {
            const subtasks = goal.subtasks || [];
            const hasSubtasks = subtasks.length > 0;
            const isExpanded = expandedGoals[goal.id];
            const stDone = subtasks.filter((st) => st.completed).length;

            return (
              <View key={goal.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.goalItem,
                    { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => dispatch({ type: 'TOGGLE_WEEKLY_GOAL', payload: goal.id })}
                  onLongPress={() => openEdit(goal)}
                  delayLongPress={400}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        borderColor: goal.completed ? colors.primary : colors.border,
                        backgroundColor: goal.completed ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {goal.completed && <Text style={styles.dotCheck}>✓</Text>}
                  </View>
                  <View style={styles.goalContent}>
                    <Text
                      style={[
                        styles.goalText,
                        {
                          color: goal.completed ? colors.textSecondary : colors.text,
                          textDecorationLine: goal.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {goal.text}
                    </Text>
                    {hasSubtasks && !isExpanded && (
                      <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>
                        {stDone}/{subtasks.length} sub-tasks
                      </Text>
                    )}
                  </View>
                  {hasSubtasks && (
                    <Pressable
                      onPress={() => toggleExpand(goal.id)}
                      style={styles.expandBtn}
                      hitSlop={8}
                    >
                      <View
                        style={[
                          styles.chevron,
                          isExpanded ? styles.chevronUp : styles.chevronDown,
                          { borderColor: colors.textMuted },
                        ]}
                      />
                    </Pressable>
                  )}
                  {!hasSubtasks && (
                    <TouchableOpacity
                      onPress={() => dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: goal.id })}
                      style={styles.deleteBtn}
                    >
                      <Text style={[styles.deleteText, { color: colors.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>

                {hasSubtasks && isExpanded && (
                  <View style={[styles.subtaskList, { borderBottomColor: colors.border }]}>
                    {subtasks.map((st) => (
                      <Pressable
                        key={st.id}
                        onPress={() =>
                          dispatch({
                            type: 'TOGGLE_GOAL_SUBTASK',
                            payload: { goalId: goal.id, subtaskId: st.id },
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
        </View>
      )}

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
        Long-press a goal to add sub-tasks
      </Text>

      {/* Edit Goal Bottom Sheet */}
      <BottomSheet visible={!!editGoal} onClose={closeEdit} title="Edit Goal">
        <View style={styles.editForm}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>GOAL</Text>
          <TextInput
            style={[
              styles.editInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            value={editText}
            onChangeText={setEditText}
            placeholder="Goal text..."
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>SUB-TASKS</Text>

          {editSubtasks.map((st) => (
            <View
              key={st.id}
              style={[styles.editSubtaskRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.editSubtaskText, { color: colors.text }]} numberOfLines={1}>
                {st.name}
              </Text>
              <TouchableOpacity onPress={() => removeEditSubtask(st.id)} style={styles.removeBtn} hitSlop={8}>
                <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addSubtaskRow}>
            <TextInput
              style={[
                styles.editInput,
                styles.subtaskInput,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              ]}
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholder="Add a sub-task..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addEditSubtask}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addSubBtn, { backgroundColor: colors.primary, opacity: newSubtask.trim() ? 1 : 0.4 }]}
              onPress={addEditSubtask}
              disabled={!newSubtask.trim()}
            >
              <Text style={styles.addSubBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
              onPress={deleteEdit}
            >
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: editText.trim() ? 1 : 0.5 }]}
              onPress={saveEdit}
              disabled={!editText.trim()}
            >
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  list: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  goalContent: {
    flex: 1,
    gap: 2,
  },
  goalText: {
    fontSize: 15,
  },
  subtaskCount: {
    fontSize: 11,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
  },
  expandBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  subtaskList: {
    paddingLeft: 50,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 4,
    borderBottomWidth: 0.5,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
    marginTop: 10,
  },
  // Edit form styles
  editForm: {
    gap: 12,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  editInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 16,
  },
  editSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editSubtaskText: {
    flex: 1,
    fontSize: 14,
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addSubtaskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 14,
  },
  addSubBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSubBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    marginTop: -1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
