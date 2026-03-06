import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getRecurrenceLabel } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

// Circle sits on the timeline line.
// Timeline line is at left=36 in the parent container.
// Task list has paddingLeft=58, so circle needs to be at 36-58 = -22 from task edge.
// Circle is 22px wide, so left = -22 - 11 = -33 to center it on the line.
const CIRCLE_SIZE = 22;
const CIRCLE_LEFT = -33;

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
        {
          backgroundColor: pressed ? colors.surface : 'transparent',
          opacity: isCompleted ? 0.6 : 1,
        },
      ]}
    >
      {/* Checkbox circle positioned on the timeline line */}
      <View
        style={[
          styles.circle,
          {
            borderColor: isCompleted ? colors.primary : colors.border,
            backgroundColor: isCompleted ? colors.primary : colors.bg,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    left: CIRCLE_LEFT,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
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
