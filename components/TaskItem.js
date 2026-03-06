import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getRecurrenceLabel } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const LINE_LEFT = 20;
const LINE_WIDTH = 2;
const CIRCLE_SIZE = 22;

export default function TaskItem({
  task,
  groupId,
  dateKey,
  onEdit,
  lineColor,
  showLineAbove,
  showLineBelow,
}) {
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
        styles.row,
        { opacity: isCompleted ? 0.6 : 1 },
      ]}
    >
      {/* Timeline column with line + circle */}
      <View style={styles.lineCol}>
        {showLineAbove && (
          <View
            style={[
              styles.lineSegmentTop,
              { backgroundColor: lineColor, left: LINE_LEFT - LINE_WIDTH / 2 },
            ]}
          />
        )}
        {showLineBelow && (
          <View
            style={[
              styles.lineSegmentBottom,
              { backgroundColor: lineColor, left: LINE_LEFT - LINE_WIDTH / 2 },
            ]}
          />
        )}
        {/* Checkbox circle on the line */}
        <View
          style={[
            styles.circle,
            {
              left: LINE_LEFT - CIRCLE_SIZE / 2,
              borderColor: isCompleted ? colors.primary : colors.border,
              backgroundColor: isCompleted ? colors.primary : colors.bg,
            },
          ]}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>

      {/* Task content */}
      <View style={styles.content}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  lineCol: {
    width: 40,
    alignSelf: 'stretch',
    position: 'relative',
  },
  lineSegmentTop: {
    position: 'absolute',
    top: 0,
    width: LINE_WIDTH,
    height: '50%',
  },
  lineSegmentBottom: {
    position: 'absolute',
    bottom: 0,
    width: LINE_WIDTH,
    height: '50%',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    top: '50%',
    marginTop: -CIRCLE_SIZE / 2,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 16,
    gap: 2,
  },
  name: {
    fontSize: 15,
  },
  recurrence: {
    fontSize: 11,
  },
});
