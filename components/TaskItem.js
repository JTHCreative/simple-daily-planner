import { useState, useCallback, memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../utils/theme';

const CIRCLE_SIZE = 22;
const CIRCLE_LEFT = -33;

const TaskItem = memo(function TaskItem({ task, groupId, dateKey, isCompleted, completedTasks, dispatch, onEdit, onEditSubtask }) {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  const subtaskIds = subtasks.map((st) => st.id);

  const handleTap = useCallback(() => {
    dispatch({ type: 'TOGGLE_TASK', payload: { taskId: task.id, dateKey, subtaskIds } });
  }, [dispatch, task.id, dateKey, subtaskIds]);

  const handleLongPress = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const toggleSubtask = useCallback((subtaskId) => {
    dispatch({
      type: 'TOGGLE_SUBTASK',
      payload: { subtaskId, dateKey, taskId: task.id, allSubtaskIds: subtaskIds },
    });
  }, [dispatch, dateKey, task.id, subtaskIds]);

  const completedCount = subtasks.filter(
    (st) => completedTasks[dateKey]?.[st.id]
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
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                {
                  color: isCompleted ? colors.textSecondary : colors.text,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                  flexShrink: 1,
                },
              ]}
            >
              {task.name}
            </Text>
            {task.alarm?.enabled && (
              <View style={styles.bellIcon}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C10.9 2 10 2.9 10 4C10 4.1 10 4.19 10.02 4.28C7.58 5.07 6 7.36 6 10V16L4 18V19H20V18L18 16V10C18 7.36 16.42 5.07 13.98 4.28C14 4.19 14 4.1 14 4C14 2.9 13.1 2 12 2ZM10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20H10Z"
                    fill={colors.primary}
                  />
                </Svg>
              </View>
            )}
          </View>
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
            const stCompleted = completedTasks[dateKey]?.[st.id] || false;
            return (
              <Pressable
                key={st.id}
                onPress={() => toggleSubtask(st.id)}
                onLongPress={() => onEditSubtask && onEditSubtask(task, st)}
                delayLongPress={400}
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
});

export default TaskItem;

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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
  },
  bellIcon: {
    marginLeft: 2,
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
