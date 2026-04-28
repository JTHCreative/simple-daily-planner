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
import { getIconById } from '../utils/icons';
import { useGroups, useDispatch } from '../context/PlannerContext';
import { shouldShowOnDate } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 72;

export default function GroupArrange({ visible, onClose, selectedDate }) {
  const colors = useTheme();
  const groups = useGroups();
  const dispatch = useDispatch();
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [targetSlot, setTargetSlot] = useState(-1);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const originalIndex = useRef(-1);
  const currentSlot = useRef(-1);
  const isDragging = useRef(false);

  const visibleGroups = useMemo(() => {
    const filtered = groups.filter((g) =>
      shouldShowOnDate(g.recurrence, selectedDate, g.createdDate)
    );
    const pinRank = (g) => (g.pinned === 'top' ? -1 : g.pinned === 'bottom' ? 1 : 0);
    return [...filtered]
      .map((g, i) => ({ g, i }))
      .sort((a, b) => {
        const r = pinRank(a.g) - pinRank(b.g);
        return r !== 0 ? r : a.i - b.i;
      })
      .map(({ g }) => g);
  }, [groups, selectedDate]);

  const applyReorder = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const newOrder = [...visibleGroups];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);

      const visibleIds = newOrder.map((g) => g.id);
      const visibleSet = new Set(visibleIds);
      const reordered = [];
      let visIdx = 0;

      for (const g of groups) {
        if (visibleSet.has(g.id)) {
          reordered.push(newOrder[visIdx]);
          visIdx++;
        } else {
          reordered.push(g);
        }
      }

      dispatch({ type: 'REORDER_GROUPS', payload: reordered });
    },
    [visibleGroups, groups, dispatch]
  );

  const moveGroup = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= visibleGroups.length) return;
    applyReorder(fromIndex, toIndex);
  };

  // Get the translateY offset for a non-dragged item based on where the
  // dragged item currently hovers
  const getShiftForIndex = (index) => {
    if (draggingIndex < 0) return 0;
    const from = originalIndex.current;
    const to = currentSlot.current;
    if (from === to) return 0;

    if (from < to) {
      // Dragged downward: items between from+1..to shift up
      if (index > from && index <= to) return -ROW_HEIGHT;
    } else {
      // Dragged upward: items between to..from-1 shift down
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
          const newSlot = Math.max(
            0,
            Math.min(visibleGroups.length - 1, from + offset)
          );

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
    [visibleGroups, applyReorder, dragY]
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
    <BottomSheet visible={visible} onClose={onClose} title="Arrange Groups">
      <View style={styles.container} {...panResponder.panHandlers}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long press and drag to reorder, or use the arrows.{'\n'}Daily groups
          are reordered for all days. Pinned groups stay in place — edit the
          group to unpin.
        </Text>

        <View style={{ minHeight: visibleGroups.length * ROW_HEIGHT }}>
          {visibleGroups.map((group, index) => {
            const icon = getIconById(group.icon);
            const isDaily = group.recurrence?.type === 'daily';
            const isPinned = group.pinned === 'top' || group.pinned === 'bottom';
            const pinLabel =
              group.pinned === 'top'
                ? '📌 Pinned Top'
                : group.pinned === 'bottom'
                  ? '📌 Pinned Bottom'
                  : null;
            const isDraggedItem = draggingIndex === index;
            const shift = getShiftForIndex(index);

            // Compute neighbor pin status to constrain arrow movement so
            // the user can't drag an unpinned item across a pin boundary.
            const prev = visibleGroups[index - 1];
            const next = visibleGroups[index + 1];
            const upDisabled =
              isPinned ||
              index === 0 ||
              (group.pinned !== 'top' && prev?.pinned === 'top');
            const downDisabled =
              isPinned ||
              index === visibleGroups.length - 1 ||
              (group.pinned !== 'bottom' && next?.pinned === 'bottom');

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
              : [
                  styles.row,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ];

            return (
              <Animated.View
                key={group.id}
                style={[
                  styles.rowWrap,
                  isDraggedItem
                    ? {
                        zIndex: 999,
                        transform: [{ translateY: dragY }],
                      }
                    : {
                        zIndex: 1,
                        transform: [{ translateY: shift }],
                      },
                ]}
              >
                <Pressable
                  style={rowStyle}
                  onLongPress={
                    isPinned
                      ? undefined
                      : (e) => handleLongPress(index, e.nativeEvent.pageY)
                  }
                  delayLongPress={200}
                >
                  <View style={[styles.dragHandle, isPinned && { opacity: 0.25 }]}>
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                    <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
                  </View>
                  <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                    <Text style={styles.rowEmoji}>{icon.emoji}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <Text style={[styles.rowBadge, { color: pinLabel ? colors.primary : colors.textMuted }]}>
                      {pinLabel || (isDaily ? 'Daily' : 'Once')}
                    </Text>
                  </View>
                  <View style={styles.arrows}>
                    <TouchableOpacity
                      onPress={() => moveGroup(index, index - 1)}
                      disabled={upDisabled || draggingIndex >= 0}
                      style={[styles.arrowBtn, upDisabled && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronUp, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveGroup(index, index + 1)}
                      disabled={downDisabled || draggingIndex >= 0}
                      style={[styles.arrowBtn, downDisabled && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {visibleGroups.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No groups to arrange for this day.
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: {
    fontSize: 20,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowBadge: {
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
