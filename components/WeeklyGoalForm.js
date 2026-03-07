import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function WeeklyGoalForm({ visible, onClose, editGoal, weekKey }) {
  const colors = useTheme();
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('🎯');
  const emojiInputRef = useRef(null);

  useEffect(() => {
    if (editGoal) {
      setText(editGoal.text);
      setIcon(editGoal.icon || '🎯');
    } else {
      setText('');
      setIcon('🎯');
    }
  }, [editGoal, visible]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (editGoal) {
      dispatch({
        type: 'UPDATE_WEEKLY_GOAL',
        payload: { id: editGoal.id, updates: { text: text.trim(), icon } },
      });
    } else {
      dispatch({
        type: 'ADD_WEEKLY_GOAL',
        payload: { text: text.trim(), icon, weekKey },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editGoal) {
      dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: editGoal.id });
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editGoal ? 'Edit Goal' : 'New Goal'}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>GOAL</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          value={text}
          onChangeText={setText}
          placeholder="e.g. Launch new feature"
          placeholderTextColor={colors.textMuted}
          autoFocus
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
            onChangeText={(val) => {
              const match = val.match(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F?/u);
              if (match) setIcon(match[0]);
            }}
            autoCorrect={false}
            blurOnSubmit
          />
        </TouchableOpacity>

        <View style={styles.actions}>
          {editGoal && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.dangerLight }]}
              onPress={handleDelete}
            >
              <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: text.trim() ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!text.trim()}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>
              {editGoal ? 'Save' : 'Add Goal'}
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
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
