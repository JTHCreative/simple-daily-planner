import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import DraggableSubtaskList from './DraggableSubtaskList';
import WeekPickerModal from './WeekPickerModal';
import { useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatWeekRange(weekKey) {
  if (!weekKey) return '';
  const start = new Date(`${weekKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sMonth = SHORT_MONTHS[start.getMonth()];
  const eMonth = SHORT_MONTHS[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `Week of ${sMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  return `Week of ${sMonth} ${start.getDate()} - ${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export default function WeeklyTaskForm({ visible, onClose, goalId, goalName, editTask, weekKey }) {
  const colors = useTheme();
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

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
  }, [editTask, visible]);

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

  const handleMoveToWeek = (targetWeekKey) => {
    if (!editTask || !targetWeekKey || targetWeekKey === weekKey) return;
    dispatch({
      type: 'MOVE_GOAL_TASK',
      payload: { goalId, taskId: editTask.id, targetWeekKey },
    });
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
        {(goalName || weekKey) && (
          <View style={[styles.context, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {goalName && (
              <View style={styles.contextRow}>
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Goal</Text>
                <Text style={[styles.contextValue, { color: colors.text }]} numberOfLines={1}>
                  {goalName}
                </Text>
              </View>
            )}
            {weekKey && (
              <TouchableOpacity
                style={styles.contextRow}
                onPress={editTask ? () => setWeekPickerOpen(true) : undefined}
                disabled={!editTask}
                activeOpacity={editTask ? 0.6 : 1}
              >
                <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Week</Text>
                <Text style={[styles.contextValue, { color: editTask ? colors.primary : colors.text }]} numberOfLines={1}>
                  {formatWeekRange(weekKey)}
                </Text>
                {editTask && (
                  <Text style={[styles.moveHint, { color: colors.textMuted }]}>Tap to move</Text>
                )}
              </TouchableOpacity>
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

        <DraggableSubtaskList
          subtasks={subtasks}
          onReorder={setSubtasks}
          onUpdateName={(id, newName) =>
            setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)))
          }
          onRemove={(id) => setSubtasks((prev) => prev.filter((s) => s.id !== id))}
          onAdd={(text) =>
            setSubtasks((prev) => [
              ...prev,
              { id: `gst-${Date.now()}-${prev.length}`, name: text, completed: false },
            ])
          }
        />

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
      {editTask && weekKey && (
        <WeekPickerModal
          visible={weekPickerOpen}
          onClose={() => setWeekPickerOpen(false)}
          currentWeekKey={weekKey}
          onSelect={handleMoveToWeek}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    paddingBottom: 32,
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
    flexShrink: 1,
  },
  moveHint: {
    fontSize: 11,
    marginLeft: 'auto',
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
