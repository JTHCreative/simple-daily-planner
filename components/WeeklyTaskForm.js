import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function WeeklyTaskForm({ visible, onClose, goalId, goalName, editTask }) {
  const colors = useTheme();
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (editTask) {
      setName(editTask.name);
      setDescription(editTask.description || '');
      setSubtasks(editTask.subtasks || []);
    } else {
      setName('');
      setDescription('');
      setSubtasks([]);
    }
    setNewSubtask('');
  }, [editTask, visible]);

  const addSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `gst-${Date.now()}-${prev.length}`, name: text, completed: false },
    ]);
    setNewSubtask('');
  };

  const removeSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editTask) {
      dispatch({
        type: 'UPDATE_GOAL_TASK',
        payload: {
          goalId,
          taskId: editTask.id,
          updates: { name: name.trim(), description: description.trim(), subtasks },
        },
      });
    } else {
      dispatch({
        type: 'ADD_GOAL_TASK',
        payload: { goalId, name: name.trim(), description: description.trim(), subtasks },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editTask) {
      dispatch({ type: 'DELETE_GOAL_TASK', payload: { goalId, taskId: editTask.id } });
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editTask ? 'Edit Task' : 'New Task'}>
      <View style={styles.form}>
        {goalName && (
          <View style={[styles.context, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Goal</Text>
            <Text style={[styles.contextValue, { color: colors.text }]} numberOfLines={1}>
              {goalName}
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>TASK NAME</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Design mockups"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPTION</Text>
        <TextInput
          style={[
            styles.input,
            styles.descInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description..."
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>SUB-TASKS</Text>

        {subtasks.map((st) => (
          <View
            key={st.id}
            style={[styles.subtaskRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.subtaskText, { color: colors.text }]} numberOfLines={1}>
              {st.name}
            </Text>
            <TouchableOpacity onPress={() => removeSubtask(st.id)} style={styles.removeBtn} hitSlop={8}>
              <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addSubtaskRow}>
          <TextInput
            style={[
              styles.input,
              styles.subtaskInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            value={newSubtask}
            onChangeText={setNewSubtask}
            placeholder="Add a sub-task..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={addSubtask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addSubBtn, { backgroundColor: colors.primary, opacity: newSubtask.trim() ? 1 : 0.4 }]}
            onPress={addSubtask}
            disabled={!newSubtask.trim()}
          >
            <Text style={styles.addSubBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {editTask && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.dangerLight }]}
              onPress={handleDelete}
            >
              <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>
              {editTask ? 'Save' : 'Add Task'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    paddingBottom: 32,
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 16,
  },
  descInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  subtaskText: {
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
