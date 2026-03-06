import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { getIconById } from '../utils/icons';
import { usePlanner } from '../context/PlannerContext';
import { shouldShowOnDate } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 72; // row height + gap

export default function GroupArrange({ visible, onClose, selectedDate }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [localOrder, setLocalOrder] = useState(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const currentIndex = useRef(-1);

  const visibleGroups = state.groups.filter((g) =>
    shouldShowOnDate(g.recurrence, selectedDate, g.createdDate)
  );

  const displayGroups = localOrder || visibleGroups;

  const commitReorder = useCallback((newVisible) => {
    const visibleIds = newVisible.map((g) => g.id);
    const visibleSet = new Set(visibleIds);
    const reordered = [];
    let visIdx = 0;

    for (const g of state.groups) {
      if (visibleSet.has(g.id)) {
        reordered.push(newVisible[visIdx]);
        visIdx++;
      } else {
        reordered.push(g);
      }
    }

    dispatch({ type: 'REORDER_GROUPS', payload: reordered });
  }, [state.groups, dispatch]);

  const moveGroup = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= visibleGroups.length) return;

    const visibleIds = visibleGroups.map((g) => g.id);
    const [movedId] = visibleIds.splice(fromIndex, 1);
    visibleIds.splice(toIndex, 0, movedId);

    const visibleSet = new Set(visibleIds);
    const reordered = [];
    let visIdx = 0;

    for (const g of state.groups) {
      if (visibleSet.has(g.id)) {
        reordered.push(state.groups.find((sg) => sg.id === visibleIds[visIdx]));
        visIdx++;
      } else {
        reordered.push(g);
      }
    }

    dispatch({ type: 'REORDER_GROUPS', payload: reordered });
  };

  const startDrag = (index, gestureY) => {
    setDraggingIndex(index);
    currentIndex.current = index;
    dragStartY.current = gestureY;
    dragY.setValue(0);
    setLocalOrder([...visibleGroups]);
  };

  const updateDrag = (gestureY) => {
    const dy = gestureY - dragStartY.current;
    dragY.setValue(dy);

    const fromIndex = draggingIndex;
    const offset = Math.round(dy / ROW_HEIGHT);
    const newIndex = Math.max(0, Math.min(visibleGroups.length - 1, fromIndex + offset));

    if (newIndex !== currentIndex.current) {
      currentIndex.current = newIndex;
      const newOrder = [...visibleGroups];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      setLocalOrder(newOrder);
    }
  };

  const endDrag = () => {
    if (localOrder) {
      commitReorder(localOrder);
    }
    setDraggingIndex(-1);
    setLocalOrder(null);
    dragY.setValue(0);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Arrange Groups">
      <View style={styles.container}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long press and drag to reorder, or use the arrows. Daily groups are reordered for all days.
        </Text>

        <View style={{ minHeight: displayGroups.length * ROW_HEIGHT }}>
          {displayGroups.map((group, index) => {
            const icon = getIconById(group.icon);
            const isDaily = group.recurrence?.type === 'daily';
            const isDragged = draggingIndex >= 0 && group.id === visibleGroups[draggingIndex]?.id;

            const panResponder = PanResponder.create({
              onStartShouldSetPanResponder: () => false,
              onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
              onPanResponderGrant: (_, g) => {
                startDrag(index, g.moveY);
              },
              onPanResponderMove: (_, g) => {
                updateDrag(g.moveY);
              },
              onPanResponderRelease: () => {
                endDrag();
              },
              onPanResponderTerminate: () => {
                endDrag();
              },
            });

            const rowStyle = isDragged
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
                key={group.id}
                style={[
                  styles.rowWrap,
                  isDragged && {
                    zIndex: 999,
                    transform: [{ translateY: dragY }],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <View style={rowStyle}>
                  <View style={styles.dragHandle}>
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
                    <Text style={[styles.rowBadge, { color: colors.textMuted }]}>
                      {isDaily ? 'Daily' : 'Once'}
                    </Text>
                  </View>
                  <View style={styles.arrows}>
                    <TouchableOpacity
                      onPress={() => moveGroup(index, index - 1)}
                      disabled={index === 0 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === 0 && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronUp, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveGroup(index, index + 1)}
                      disabled={index === displayGroups.length - 1 || draggingIndex >= 0}
                      style={[styles.arrowBtn, index === displayGroups.length - 1 && { opacity: 0.25 }]}
                    >
                      <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {displayGroups.length === 0 && (
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
