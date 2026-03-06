import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getRecurrenceLabel } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

export default function TaskItem({ task, groupId, dateKey, onEdit }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();
  const isCompleted = state.completedTasks[dateKey]?.[task.id] || false;

  const handleTap = () => {
    dispatch({ type: 'TOGGLE_TASK', payload: { taskId: task.id, dateKey } });
  };

  const handleLongPress = () => {
    onEdit(task);
  };

  const recLabel = getRecurrenceLabel(task.recurrence);

  return (
    <Pressable
      onPress={handleTap}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surface : colors.bg, opacity: isCompleted ? 0.6 : 1 },
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? colors.primary : colors.border,
            backgroundColor: isCompleted ? colors.primary : 'transparent',
          },
        ]}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.name,
            {
              color: isCompleted ? colors.textSecondary : colors.text,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            },
          ]}
        >
          {task.name}
        </Text>
        {recLabel !== 'One time' && (
          <Text style={[styles.recurrence, { color: colors.textMuted }]}>{recLabel}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
  },
  recurrence: {
    fontSize: 11,
  },
});
