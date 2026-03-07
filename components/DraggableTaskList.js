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
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 52;

export default function DraggableTaskList({ tasks, onReorder }) {
  const colors = useTheme();
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [targetSlot, setTargetSlot] = useState(-1);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const originalIndex = useRef(-1);
  const currentSlot = useRef(-1);
  const isDragging = useRef(false);

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

  const applyReorder = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const newOrder = [...tasks];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      onReorder(newOrder);
    },
    [tasks, onReorder]
  );

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= tasks.length) return;
    applyReorder(fromIndex, toIndex);
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

  if (tasks.length === 0) return null;

  return (
    <View>
      <View {...panResponder.panHandlers} style={{ minHeight: tasks.length * ROW_HEIGHT }}>
        {tasks.map((task, index) => {
          const isDraggedItem = draggingIndex === index;
          const shift = getShiftForIndex(index);
          const subtaskCount = (task.subtasks || []).length;

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
                style={[
                  styles.taskRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDraggedItem ? colors.primary : colors.border,
                    borderWidth: isDraggedItem ? 2 : 1,
                  },
                  isDraggedItem && {
                    elevation: 8,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                  },
                ]}
                onLongPress={(e) => handleLongPress(index, e.nativeEvent.pageY)}
                delayLongPress={200}
              >
                <View style={styles.dragHandle}>
                  <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                  <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                  <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                </View>

                <View style={styles.nameArea}>
                  <Text style={[styles.taskText, { color: colors.text }]} numberOfLines={1}>
                    {task.name}
                  </Text>
                  {subtaskCount > 0 && (
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {subtaskCount} sub-task{subtaskCount !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {tasks.length > 1 && (
                  <View style={styles.arrows}>
                    <TouchableOpacity
                      onPress={() => moveItem(index, index - 1)}
                      disabled={index === 0 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === 0 && { opacity: 0.25 }]}
                      hitSlop={4}
                    >
                      <View style={[styles.chevron, styles.chevronUp, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveItem(index, index + 1)}
                      disabled={index === tasks.length - 1 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === tasks.length - 1 && { opacity: 0.25 }]}
                      hitSlop={4}
                    >
                      <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {tasks.length > 1 && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long-press and drag to reorder, or use arrows
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    marginBottom: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  dragHandle: {
    width: 16,
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  handleBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  nameArea: {
    flex: 1,
    paddingVertical: 2,
    gap: 1,
  },
  taskText: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 11,
  },
  arrows: {
    flexDirection: 'column',
    gap: 2,
  },
  arrowBtn: {
    width: 24,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  chevronUp: {
    transform: [{ rotate: '-45deg' }],
    marginTop: 2,
  },
  chevronDown: {
    transform: [{ rotate: '135deg' }],
    marginBottom: 2,
  },
  hint: {
    fontSize: 11,
    marginTop: -2,
    marginBottom: 4,
  },
});
