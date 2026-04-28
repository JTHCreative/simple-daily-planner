import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import RecurrencePicker from './RecurrencePicker';
import DraggableTaskList from './DraggableTaskList';
import { useDispatch } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { useTheme } from '../utils/theme';

export default function GroupForm({ visible, onClose, editGroup, selectedDate, fromTemplate }) {
  const colors = useTheme();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('☀️');
  const [recurrence, setRecurrence] = useState({ type: 'once' });
  const [tasks, setTasks] = useState([]);
  const [pinned, setPinned] = useState(null); // 'top' | 'bottom' | null
  const [templateSaved, setTemplateSaved] = useState(false);
  const emojiInputRef = useRef(null);

  useEffect(() => {
    setTemplateSaved(false);
    if (editGroup) {
      setName(editGroup.name);
      setDescription(editGroup.description || '');
      const resolved = getIconById(editGroup.icon);
      setIcon(resolved.emoji);
      setRecurrence(editGroup.recurrence || { type: 'once' });
      setTasks(editGroup.tasks || []);
      setPinned(editGroup.pinned || null);
    } else if (fromTemplate) {
      setName(fromTemplate.name);
      setDescription(fromTemplate.description || '');
      const resolved = getIconById(fromTemplate.icon);
      setIcon(resolved.emoji);
      setRecurrence(fromTemplate.recurrence || { type: 'once' });
      setTasks([]);
      setPinned(null);
    } else {
      setName('');
      setDescription('');
      setIcon('☀️');
      setRecurrence({ type: 'once' });
      setTasks([]);
      setPinned(null);
    }
  }, [editGroup, fromTemplate, visible]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: {
          id: editGroup.id,
          updates: {
            name: name.trim(),
            description: description.trim(),
            icon,
            recurrence,
            pinned: recurrence?.type === 'daily' ? pinned : null,
          },
        },
      });
      dispatch({ type: 'REORDER_TASKS', payload: { groupId: editGroup.id, tasks } });
    } else {
      const createdDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dispatch({
        type: 'ADD_GROUP',
        payload: {
          name: name.trim(),
          description: description.trim(),
          icon,
          recurrence,
          createdDate,
          templateTasks: fromTemplate?.tasks || [],
        },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editGroup) {
      const deletedDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dispatch({ type: 'DELETE_GROUP', payload: { groupId: editGroup.id, deletedDate } });
      onClose();
    }
  };

  const handleSaveAsTemplate = () => {
    dispatch({
      type: 'SAVE_TEMPLATE',
      payload: {
        name: name.trim(),
        description: description.trim(),
        icon,
        recurrence,
        tasks: editGroup?.tasks || [],
      },
    });
    setTemplateSaved(true);
    Alert.alert('Template Saved', `"${name.trim()}" has been saved as a template.`);
  };

  const title = editGroup ? 'Edit Group' : fromTemplate ? 'New Group from Template' : 'New Group';

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
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

        <Text style={[styles.label, styles.sectionLabel, { color: colors.textSecondary }]}>REPEATS</Text>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

        {recurrence?.type === 'daily' && (
          <>
            <Text style={[styles.label, styles.sectionLabel, { color: colors.textSecondary }]}>PIN POSITION</Text>
            <View style={[styles.pinRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.pinOption,
                  pinned === null && { backgroundColor: colors.primary },
                ]}
                onPress={() => setPinned(null)}
              >
                <Text
                  style={[
                    styles.pinOptionText,
                    { color: pinned === null ? '#fff' : colors.text },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pinOption,
                  pinned === 'top' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setPinned('top')}
              >
                <Text
                  style={[
                    styles.pinOptionText,
                    { color: pinned === 'top' ? '#fff' : colors.text },
                  ]}
                >
                  📌 Top
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pinOption,
                  pinned === 'bottom' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setPinned('bottom')}
              >
                <Text
                  style={[
                    styles.pinOptionText,
                    { color: pinned === 'bottom' ? '#fff' : colors.text },
                  ]}
                >
                  📌 Bottom
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.pinHint, { color: colors.textMuted }]}>
              {pinned === 'top'
                ? 'This group will always appear at the top of the daily list.'
                : pinned === 'bottom'
                  ? 'This group will always appear at the bottom of the daily list. New groups will be added above it.'
                  : 'Use the arrange screen to position this group manually.'}
            </Text>
          </>
        )}

        {editGroup && tasks.length > 0 && (
          <>
            <Text style={[styles.label, styles.sectionLabel, { color: colors.textSecondary }]}>ORGANIZE TASKS</Text>
            <DraggableTaskList tasks={tasks} onReorder={setTasks} />
          </>
        )}

        {editGroup && (
          <>
            <Text style={[styles.label, styles.sectionLabel, { color: colors.textSecondary }]}>TEMPLATES</Text>
            <TouchableOpacity
              style={[
                styles.templateBtn,
                {
                  backgroundColor: templateSaved ? colors.surface : colors.primaryLight,
                  borderColor: templateSaved ? colors.border : colors.primary,
                },
              ]}
              onPress={handleSaveAsTemplate}
              disabled={!name.trim() || templateSaved}
              activeOpacity={0.7}
            >
              <Text style={styles.templateEmoji}>{templateSaved ? '✓' : '📋'}</Text>
              <Text
                style={[
                  styles.templateBtnText,
                  { color: templateSaved ? colors.textMuted : colors.primary },
                ]}
              >
                {templateSaved ? 'Template Saved' : 'Save As Template'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {fromTemplate && fromTemplate.tasks?.length > 0 && (
          <View style={[styles.templateInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.templateInfoLabel, { color: colors.textSecondary }]}>
              TASKS FROM TEMPLATE
            </Text>
            {fromTemplate.tasks.map((t, i) => (
              <View key={i} style={styles.templateTaskRow}>
                <Text style={[styles.templateTaskBullet, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.templateTaskName, { color: colors.text }]}>
                  {t.name}
                  {t.subtasks?.length > 0 && (
                    <Text style={{ color: colors.textMuted }}> ({t.subtasks.length} subtask{t.subtasks.length !== 1 ? 's' : ''})</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

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
  sectionLabel: {
    marginTop: 12,
  },
  pinRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pinOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pinHint: {
    fontSize: 12,
    marginTop: -4,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  templateEmoji: {
    fontSize: 16,
  },
  templateBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  templateInfo: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  templateInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  templateTaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  templateTaskBullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateTaskName: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
