import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Animated,
  Vibration,
  StyleSheet,
} from 'react-native';
import BottomSheet from './BottomSheet';
import { useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 64;

/**
 * Reorder tasks within a group (daily) or a weekly goal.
 *
 * Props:
 *  - visible, onClose
 *  - tasks: array of task objects
 *  - title: header text e.g. "Arrange Tasks"
 *  - mode: 'group' | 'goal'
 *  - groupId: required when mode === 'group'
 *  - goalId: required when mode === 'goal'
 */
export default function TaskArrange({ visible, onClose, tasks, title, mode, groupId, goalId }) {
  const colors = useTheme();
  const dispatch = useDispatch();
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [targetSlot, setTargetSlot] = useState(-1);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const originalIndex = useRef(-1);
  const currentSlot = useRef(-1);
  const isDragging = useRef(false);

  const applyReorder = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const newOrder = [...tasks];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);

      if (mode === 'group') {
        dispatch({ type: 'REORDER_TASKS', payload: { groupId, tasks: newOrder } });
      } else {
        dispatch({ type: 'REORDER_GOAL_TASKS', payload: { goalId, tasks: newOrder } });
      }
    },
    [tasks, mode, groupId, goalId, dispatch]
  );

  const moveTask = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= tasks.length) return;
    applyReorder(fromIndex, toIndex);
  };

  const getShiftForIndex = (index) => {
    if (draggingIndex < 0) return 0;
    const from = originalIndex.current;
    const to = currentSlot.current;
    if (from === to) return 0;
    if (from < to) {
      if (index > from && index <= to) return -ROW_HEIGHT;
    } else {
      if (index >= to && index < from) return ROW_HEIGHT;
    }
    return 0;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDragging.current,
        onMoveShouldSetPanResponder: () => isDragging.current,
        onPanResponderMove: (_, gesture) => {
          if (!isDragging.current) return;
          const dy = gesture.moveY - dragStartY.current;
          dragY.setValue(dy);

          const from = originalIndex.current;
          const offset = Math.round(dy / ROW_HEIGHT);
          const newSlot = Math.max(0, Math.min(tasks.length - 1, from + offset));

          if (newSlot !== currentSlot.current) {
            currentSlot.current = newSlot;
            setTargetSlot(newSlot);
          }
        },
        onPanResponderRelease: () => {
          if (!isDragging.current) return;
          isDragging.current = false;
          const from = originalIndex.current;
          const to = currentSlot.current;
          applyReorder(from, to);
          setDraggingIndex(-1);
          setTargetSlot(-1);
          dragY.setValue(0);
        },
        onPanResponderTerminate: () => {
          isDragging.current = false;
          setDraggingIndex(-1);
          setTargetSlot(-1);
          dragY.setValue(0);
        },
      }),
    [tasks, applyReorder, dragY]
  );

  const handleLongPress = (index, pageY) => {
    isDragging.current = true;
    originalIndex.current = index;
    currentSlot.current = index;
    dragStartY.current = pageY;
    dragY.setValue(0);
    setDraggingIndex(index);
    setTargetSlot(index);
    Vibration.vibrate(30);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title || 'Arrange Tasks'}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long-press and drag to reorder, or use the arrows.
        </Text>

        <View style={{ minHeight: tasks.length * ROW_HEIGHT }}>
          {tasks.map((task, index) => {
            const isDraggedItem = draggingIndex === index;
            const shift = getShiftForIndex(index);
            const subtaskCount = (task.subtasks || []).length;

            const rowStyle = isDraggedItem
              ? [
                  styles.row,
                  styles.rowDragging,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]
              : [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }];

            return (
              <Animated.View
                key={task.id}
                style={[
                  styles.rowWrap,
                  isDraggedItem
                    ? { zIndex: 999, transform: [{ translateY: dragY }] }
                    : { zIndex: 1, transform: [{ translateY: shift }] },
                ]}
              >
                <Pressable
                  style={rowStyle}
                  onLongPress={(e) => handleLongPress(index, e.nativeEvent.pageY)}
                  delayLongPress={200}
                >
                  <View style={styles.dragHandle}>
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                      {task.name}
                    </Text>
                    {subtaskCount > 0 && (
                      <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                        {subtaskCount} sub-task{subtaskCount !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  <View style={styles.arrows}>
                    <TouchableOpacity
                      onPress={() => moveTask(index, index - 1)}
                      disabled={index === 0 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === 0 && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronUp, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveTask(index, index + 1)}
                      disabled={index === tasks.length - 1 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === tasks.length - 1 && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {tasks.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No tasks to arrange.
          </Text>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  rowWrap: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  rowDragging: {
    borderWidth: 2,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dragHandle: {
    width: 18,
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  handleBar: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 11,
  },
  arrows: {
    flexDirection: 'column',
    gap: 4,
  },
  arrowBtn: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  chevronUp: {
    transform: [{ rotate: '-45deg' }],
    marginTop: 3,
  },
  chevronDown: {
    transform: [{ rotate: '135deg' }],
    marginBottom: 3,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
