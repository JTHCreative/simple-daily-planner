import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Animated,
  Vibration,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 52;

export default function DraggableSubtaskList({ subtasks, onReorder, onUpdateName, onRemove, onAdd }) {
  const colors = useTheme();
  const [newSubtask, setNewSubtask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [targetSlot, setTargetSlot] = useState(-1);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const originalIndex = useRef(-1);
  const currentSlot = useRef(-1);
  const isDragging = useRef(false);

  const addSubtask = () => {
    const text = newSubtask.trim();
    if (!text) return;
    onAdd(text);
    setNewSubtask('');
  };

  const startEditing = (st) => {
    setEditingId(st.id);
    setEditingName(st.name);
  };

  const commitEditing = () => {
    if (editingId && editingName.trim()) {
      onUpdateName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
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

  const applyReorder = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const newOrder = [...subtasks];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      onReorder(newOrder);
    },
    [subtasks, onReorder]
  );

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= subtasks.length) return;
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
          const newSlot = Math.max(0, Math.min(subtasks.length - 1, from + offset));

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
    [subtasks, applyReorder, dragY]
  );

  const handleLongPress = (index, pageY) => {
    if (editingId) return; // Don't start drag while editing
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
    <View>
      {subtasks.length > 0 && (
        <View {...panResponder.panHandlers} style={{ minHeight: subtasks.length * ROW_HEIGHT }}>
          {subtasks.map((st, index) => {
            const isDraggedItem = draggingIndex === index;
            const shift = getShiftForIndex(index);
            const isEditing = editingId === st.id;

            return (
              <Animated.View
                key={st.id}
                style={[
                  styles.rowWrap,
                  isDraggedItem
                    ? { zIndex: 999, transform: [{ translateY: dragY }] }
                    : { zIndex: 1, transform: [{ translateY: shift }] },
                ]}
              >
                <Pressable
                  style={[
                    styles.subtaskRow,
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
                  {/* Drag handle */}
                  <View style={styles.dragHandle}>
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                  </View>

                  {/* Name — tap to edit, long-press to drag */}
                  {isEditing ? (
                    <TextInput
                      style={[styles.editInput, { color: colors.text, borderColor: colors.primary }]}
                      value={editingName}
                      onChangeText={setEditingName}
                      onBlur={commitEditing}
                      onSubmitEditing={commitEditing}
                      autoFocus
                      selectTextOnFocus
                      returnKeyType="done"
                    />
                  ) : (
                    <Pressable
                      style={styles.nameArea}
                      onPress={() => startEditing(st)}
                      onLongPress={(e) => handleLongPress(index, e.nativeEvent.pageY)}
                      delayLongPress={200}
                    >
                      <Text style={[styles.subtaskText, { color: colors.text }]} numberOfLines={1}>
                        {st.name}
                      </Text>
                    </Pressable>
                  )}

                  {/* Up/Down arrows */}
                  {subtasks.length > 1 && !isEditing && (
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
                        disabled={index === subtasks.length - 1 || draggingIndex >= 0}
                        style={[styles.arrowBtn, index === subtasks.length - 1 && { opacity: 0.25 }]}
                        hitSlop={4}
                      >
                        <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Remove button */}
                  {!isEditing && (
                    <TouchableOpacity onPress={() => onRemove(st.id)} style={styles.removeBtn} hitSlop={8}>
                      <Text style={[styles.removeText, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {subtasks.length > 1 && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long-press and drag to reorder, or use arrows
        </Text>
      )}

      {/* Add subtask input */}
      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
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
          style={[styles.addBtn, { backgroundColor: colors.primary, opacity: newSubtask.trim() ? 1 : 0.4 }]}
          onPress={addSubtask}
          disabled={!newSubtask.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    marginBottom: 6,
  },
  subtaskRow: {
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
  },
  subtaskText: {
    fontSize: 14,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  hint: {
    fontSize: 11,
    marginTop: -2,
    marginBottom: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    marginTop: -1,
  },
});
