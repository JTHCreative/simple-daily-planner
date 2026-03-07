import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { useGroups, useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function SubtaskEditForm({ visible, onClose, groupId, taskId, editSubtask }) {
  const colors = useTheme();
  const groups = useGroups();
  const dispatch = useDispatch();
  const [name, setName] = useState('');

  useEffect(() => {
    if (editSubtask) {
      setName(editSubtask.name);
    } else {
      setName('');
    }
  }, [editSubtask, visible]);

  const findTask = () => {
    for (const g of groups) {
      if (g.id === groupId) {
        return g.tasks.find((t) => t.id === taskId);
      }
    }
    return null;
  };

  const handleSave = () => {
    if (!name.trim() || !editSubtask) return;
    const task = findTask();
    if (!task) return;
    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === editSubtask.id ? { ...st, name: name.trim() } : st
    );
    dispatch({
      type: 'UPDATE_TASK',
      payload: { groupId, taskId, updates: { subtasks: updatedSubtasks } },
    });
    onClose();
  };

  const handleDelete = () => {
    if (!editSubtask) return;
    const task = findTask();
    if (!task) return;
    const updatedSubtasks = (task.subtasks || []).filter((st) => st.id !== editSubtask.id);
    dispatch({
      type: 'UPDATE_TASK',
      payload: { groupId, taskId, updates: { subtasks: updatedSubtasks } },
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Sub-task">
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>SUB-TASK NAME</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Sub-task name"
          placeholderTextColor={colors.textMuted}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.dangerLight }]}
            onPress={handleDelete}
          >
            <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
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
