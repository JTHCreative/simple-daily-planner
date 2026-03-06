import { useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

const CIRCLE_SIZE = 22;
const CIRCLE_LEFT = -33;

export default function TaskItem({ task, groupId, dateKey, onEdit }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();
  const isCompleted = state.completedTasks[dateKey]?.[task.id] || false;
  const [expanded, setExpanded] = useState(false);

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  const handleTap = () => {
    dispatch({ type: 'TOGGLE_TASK', payload: { taskId: task.id, dateKey } });
  };

  const handleLongPress = () => {
    onEdit(task);
  };

  const toggleSubtask = (subtaskId) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { subtaskId, dateKey } });
  };

  const completedCount = subtasks.filter(
    (st) => state.completedTasks[dateKey]?.[st.id]
  ).length;

  return (
    <View>
      <Pressable
        onPress={handleTap}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: pressed ? colors.surface : 'transparent',
            opacity: 1,
          },
        ]}
      >
        {/* Checkbox circle positioned on the timeline line */}
        <Pressable
          onPress={handleTap}
          style={styles.circleHit}
          hitSlop={8}
        >
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
        </Pressable>

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
          {task.description ? (
            <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
          {hasSubtasks && !expanded && (
            <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>
              {completedCount}/{subtasks.length} sub-tasks
            </Text>
          )}
        </View>

        {hasSubtasks && (
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            style={styles.expandBtn}
            hitSlop={8}
          >
            <View
              style={[
                styles.chevron,
                expanded ? styles.chevronUp : styles.chevronDown,
                { borderColor: colors.textMuted },
              ]}
            />
          </Pressable>
        )}
      </Pressable>

      {hasSubtasks && expanded && (
        <View style={styles.subtaskList}>
          {subtasks.map((st) => {
            const stCompleted = state.completedTasks[dateKey]?.[st.id] || false;
            return (
              <Pressable
                key={st.id}
                onPress={() => toggleSubtask(st.id)}
                style={({ pressed }) => [
                  styles.subtaskRow,
                  { backgroundColor: pressed ? colors.surface : 'transparent' },
                ]}
              >
                <View
                  style={[
                    styles.subtaskCheck,
                    {
                      borderColor: stCompleted ? colors.primary : colors.border,
                      backgroundColor: stCompleted ? colors.primary : colors.bg,
                    },
                  ]}
                >
                  {stCompleted && <Text style={styles.subtaskCheckmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.subtaskName,
                    {
                      color: stCompleted ? colors.textSecondary : colors.text,
                      textDecorationLine: stCompleted ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {st.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
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
  circleHit: {
    position: 'absolute',
    left: CIRCLE_LEFT - 6,
    width: CIRCLE_SIZE + 12,
    height: CIRCLE_SIZE + 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  description: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  subtaskCount: {
    fontSize: 11,
    marginTop: 1,
  },
  expandBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  chevronDown: {
    transform: [{ rotate: '135deg' }],
    marginBottom: 3,
  },
  chevronUp: {
    transform: [{ rotate: '-45deg' }],
    marginTop: 3,
  },
  subtaskList: {
    paddingLeft: 16,
    paddingBottom: 4,
    gap: 2,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  subtaskCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  subtaskName: {
    fontSize: 13,
    flex: 1,
  },
});
