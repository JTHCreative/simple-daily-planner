import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';
import { requestNotificationPermissions } from '../utils/notifications';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(date) {
  if (!date) return '';
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TaskForm({ visible, onClose, groupId, groupName, editTask, selectedDate, groupRecurrence }) {
  const colors = useTheme();
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('daily');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmHour, setAlarmHour] = useState(8);
  const [alarmMinute, setAlarmMinute] = useState(0);

  const isGroupDaily = groupRecurrence?.type === 'daily';

  useEffect(() => {
    if (editTask) {
      setName(editTask.name);
      setDescription(editTask.description || '');
      setSubtasks(editTask.subtasks || []);
      setTaskRecurrence(editTask.recurrence || 'daily');
      setAlarmEnabled(editTask.alarm?.enabled || false);
      setAlarmHour(editTask.alarm?.hour ?? 8);
      setAlarmMinute(editTask.alarm?.minute ?? 0);
    } else {
      setName('');
      setDescription('');
      setSubtasks([]);
      setTaskRecurrence('daily');
      setAlarmEnabled(false);
      setAlarmHour(8);
      setAlarmMinute(0);
    }
    setNewSubtask('');
  }, [editTask, visible]);

  const handleAlarmToggle = async (value) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }
    setAlarmEnabled(value);
  };

  const adjustTime = (field, delta) => {
    if (field === 'hour') {
      setAlarmHour((prev) => ((prev + delta + 24) % 24));
    } else {
      setAlarmMinute((prev) => ((prev + delta + 60) % 60));
    }
  };

  const formatTimeDisplay = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const addSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    setSubtasks((prev) => [...prev, { id: `st-${Date.now()}-${prev.length}`, name: text }]);
    setNewSubtask('');
  };

  const removeSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const recurrence = isGroupDaily ? taskRecurrence : 'daily';
    const alarm = { enabled: alarmEnabled, hour: alarmHour, minute: alarmMinute };
    if (editTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          groupId,
          taskId: editTask.id,
          updates: { name: name.trim(), description: description.trim(), subtasks, recurrence, alarm },
        },
      });
    } else {
      const createdDate = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dispatch({
        type: 'ADD_TASK',
        payload: { groupId, name: name.trim(), description: description.trim(), subtasks, createdDate, recurrence, alarm },
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

          {isGroupDaily && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>RECURRENCE</Text>
              <View style={[styles.recurrenceRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.recurrenceOption,
                    taskRecurrence === 'daily' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setTaskRecurrence('daily')}
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: taskRecurrence === 'daily' ? '#fff' : colors.text },
                    ]}
                  >
                    Repeats Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recurrenceOption,
                    taskRecurrence === 'once' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setTaskRecurrence('once')}
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: taskRecurrence === 'once' ? '#fff' : colors.text },
                    ]}
                  >
                    One-off
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.recurrenceHint, { color: colors.textMuted }]}>
                {taskRecurrence === 'daily'
                  ? 'This task will appear every day with the group'
                  : `This task will only appear on ${formatDate(selectedDate)}`}
              </Text>
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>ALARM</Text>
          <View style={[styles.alarmRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.alarmLabel, { color: colors.text }]}>Enable Alarm</Text>
            <Switch
              value={alarmEnabled}
              onValueChange={handleAlarmToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={alarmEnabled ? colors.primary : colors.textMuted}
            />
          </View>
          {alarmEnabled && (
            <View style={[styles.timePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Reminder at</Text>
              <View style={styles.timeControls}>
                <View style={styles.timeUnit}>
                  <TouchableOpacity onPress={() => adjustTime('hour', 1)} style={styles.timeBtn} hitSlop={6}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▲</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {(alarmHour === 0 ? 12 : alarmHour > 12 ? alarmHour - 12 : alarmHour).toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={() => adjustTime('hour', -1)} style={styles.timeBtn} hitSlop={6}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▼</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
                <View style={styles.timeUnit}>
                  <TouchableOpacity onPress={() => adjustTime('minute', 5)} style={styles.timeBtn} hitSlop={6}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▲</Text>
                  </TouchableOpacity>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {alarmMinute.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={() => adjustTime('minute', -5)} style={styles.timeBtn} hitSlop={6}>
                    <Text style={[styles.timeArrow, { color: colors.primary }]}>▼</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.periodBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={() => setAlarmHour((prev) => (prev + 12) % 24)}
                >
                  <Text style={[styles.periodText, { color: colors.primary }]}>
                    {alarmHour >= 12 ? 'PM' : 'AM'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  recurrenceRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  recurrenceOption: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recurrenceHint: {
    fontSize: 12,
    marginTop: -4,
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
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  alarmLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  timePicker: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeUnit: {
    alignItems: 'center',
    gap: 2,
  },
  timeBtn: {
    padding: 4,
  },
  timeArrow: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
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
