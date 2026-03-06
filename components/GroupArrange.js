import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Animated, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { getIconById } from '../utils/icons';
import { usePlanner } from '../context/PlannerContext';
import { shouldShowOnDate } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const ROW_HEIGHT = 64;

function DraggableRow({ group, index, totalCount, onMoveUp, onMoveDown, colors }) {
  const icon = getIconById(group.icon);
  const isDaily = group.recurrence?.type === 'daily';

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          onPress={onMoveUp}
          disabled={index === 0}
          style={[styles.arrowBtn, index === 0 && { opacity: 0.25 }]}
        >
          <View style={[styles.chevron, styles.chevronUp, { borderColor: colors.text }]} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMoveDown}
          disabled={index === totalCount - 1}
          style={[styles.arrowBtn, index === totalCount - 1 && { opacity: 0.25 }]}
        >
          <View style={[styles.chevron, styles.chevronDown, { borderColor: colors.text }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GroupArrange({ visible, onClose, selectedDate }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();

  const visibleGroups = state.groups.filter((g) =>
    shouldShowOnDate(g.recurrence, selectedDate, g.createdDate)
  );

  const moveGroup = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= visibleGroups.length) return;

    // Get the IDs in visible order
    const visibleIds = visibleGroups.map((g) => g.id);
    const [movedId] = visibleIds.splice(fromIndex, 1);
    visibleIds.splice(toIndex, 0, movedId);

    // Rebuild the full groups array: put visible groups in new order,
    // keep non-visible groups in their original positions
    const visibleSet = new Set(visibleIds);
    const reordered = [];
    let visIdx = 0;

    for (const g of state.groups) {
      if (visibleSet.has(g.id)) {
        // Place the next visible group in order
        reordered.push(state.groups.find((sg) => sg.id === visibleIds[visIdx]));
        visIdx++;
      } else {
        reordered.push(g);
      }
    }

    dispatch({ type: 'REORDER_GROUPS', payload: reordered });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Arrange Groups">
      <View style={styles.container}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Use the arrows to reorder groups. Daily groups will be reordered for all days.
        </Text>

        {visibleGroups.map((group, index) => (
          <DraggableRow
            key={group.id}
            group={group}
            index={index}
            totalCount={visibleGroups.length}
            onMoveUp={() => moveGroup(index, index - 1)}
            onMoveDown={() => moveGroup(index, index + 1)}
            colors={colors}
          />
        ))}

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
    gap: 8,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
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
