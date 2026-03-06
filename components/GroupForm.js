import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import IconPicker from './IconPicker';
import RecurrencePicker from './RecurrencePicker';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function GroupForm({ visible, onClose, editGroup }) {
  const colors = useTheme();
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('sun');
  const [recurrence, setRecurrence] = useState({ type: 'once' });

  useEffect(() => {
    if (editGroup) {
      setName(editGroup.name);
      setIcon(editGroup.icon);
      setRecurrence(editGroup.recurrence || { type: 'once' });
    } else {
      setName('');
      setIcon('sun');
      setRecurrence({ type: 'once' });
    }
  }, [editGroup, visible]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: { id: editGroup.id, updates: { name: name.trim(), icon, recurrence } },
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        payload: { name: name.trim(), icon, recurrence },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editGroup) {
      dispatch({ type: 'DELETE_GROUP', payload: editGroup.id });
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editGroup ? 'Edit Group' : 'New Group'}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>GROUP NAME</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning Routine"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>ICON</Text>
        <IconPicker selected={icon} onSelect={setIcon} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>REPEATS</Text>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

        <View style={styles.actions}>
          {editGroup && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.dangerLight }]}
              onPress={handleDelete}
            >
              <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>
              {editGroup ? 'Save' : 'Add Group'}
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
  btnPrimary: {},
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
