import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import RecurrencePicker from './RecurrencePicker';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(date) {
  if (!date) return '';
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TaskForm({ visible, onClose, groupId, groupName, editTask, selectedDate }) {
  const colors = useTheme();
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState({ type: 'once' });

  useEffect(() => {
    if (editTask) {
      setName(editTask.name);
      setDescription(editTask.description || '');
      setRecurrence(editTask.recurrence || { type: 'once' });
    } else {
      setName('');
      setDescription('');
      setRecurrence({ type: 'once' });
    }
  }, [editTask, visible]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { groupId, taskId: editTask.id, updates: { name: name.trim(), description: description.trim(), recurrence } },
      });
    } else {
      const createdDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dispatch({
        type: 'ADD_TASK',
        payload: { groupId, name: name.trim(), description: description.trim(), recurrence, createdDate },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editTask) {
      dispatch({ type: 'DELETE_TASK', payload: { groupId, taskId: editTask.id } });
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editTask ? 'Edit Task' : 'New Task'}>
      <View style={styles.form}>
        {(groupName || selectedDate) && (
          <View style={[styles.context, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {groupName && (
              <View style={styles.contextRow}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Group</Text>
                <Text style={[styles.contextValue, { color: colors.text }]}>{groupName}</Text>
              </View>
            )}
            {selectedDate && (
              <View style={styles.contextRow}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Date</Text>
                <Text style={[styles.contextValue, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
              </View>
            )}
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
          placeholder="e.g. Read Bible"
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

        <Text style={[styles.label, { color: colors.textSecondary }]}>REPEATS</Text>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

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
  context: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginBottom: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 44,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '500',
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
