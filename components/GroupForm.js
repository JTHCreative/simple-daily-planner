import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import RecurrencePicker from './RecurrencePicker';
import { usePlanner } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { useTheme } from '../utils/theme';

export default function GroupForm({ visible, onClose, editGroup, selectedDate }) {
  const colors = useTheme();
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('☀️');
  const [recurrence, setRecurrence] = useState({ type: 'once' });
  const emojiInputRef = useRef(null);

  useEffect(() => {
    if (editGroup) {
      setName(editGroup.name);
      setDescription(editGroup.description || '');
      const resolved = getIconById(editGroup.icon);
      setIcon(resolved.emoji);
      setRecurrence(editGroup.recurrence || { type: 'once' });
    } else {
      setName('');
      setDescription('');
      setIcon('☀️');
      setRecurrence({ type: 'once' });
    }
  }, [editGroup, visible]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: { id: editGroup.id, updates: { name: name.trim(), description: description.trim(), icon, recurrence } },
      });
    } else {
      const createdDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dispatch({
        type: 'ADD_GROUP',
        payload: { name: name.trim(), description: description.trim(), icon, recurrence, createdDate },
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

        <Text style={[styles.label, { color: colors.textSecondary }]}>ICON</Text>
        <TouchableOpacity
          style={[styles.emojiRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => emojiInputRef.current?.focus()}
          activeOpacity={0.7}
        >
          <Text style={[styles.emojiRowLabel, { color: colors.textSecondary }]}>Select Icon</Text>
          <View style={[styles.emojiPreview, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.emojiPreviewText}>{icon}</Text>
          </View>
          <TextInput
            ref={emojiInputRef}
            style={styles.emojiHiddenInput}
            value=""
            onChangeText={(text) => {
              // Take only the first emoji character(s)
              const match = text.match(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F?/u);
              if (match) setIcon(match[0]);
            }}
            autoCorrect={false}
            blurOnSubmit
          />
        </TouchableOpacity>

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
  descInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  emojiRowLabel: {
    fontSize: 15,
    flex: 1,
  },
  emojiPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPreviewText: {
    fontSize: 24,
  },
  emojiHiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
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
