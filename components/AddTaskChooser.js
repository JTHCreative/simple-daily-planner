import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { useWeeklyGoals } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function AddTaskChooser({ visible, onClose, onCreateNew, onSelectGoalTask, weekKey }) {
  const colors = useTheme();
  const weeklyGoals = useWeeklyGoals();

  const goalsWithTasks = useMemo(() => {
    return weeklyGoals
      .filter((g) => g.weekKey === weekKey && (g.tasks || []).length > 0)
      .map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => ({
          ...t,
          isLinked: !!t.linkedDailyTaskId,
        })),
      }));
  }, [weeklyGoals, weekKey]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Task">
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            onClose();
            onCreateNew();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.optionEmoji}>✨</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Create New</Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Start from scratch with an empty task
            </Text>
          </View>
        </TouchableOpacity>

        {goalsWithTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              IMPORT FROM WEEKLY GOAL
            </Text>

            {goalsWithTasks.map((goal) => (
              <View
                key={goal.id}
                style={[styles.goalSection, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalEmoji}>{goal.icon || '\uD83C\uDFAF'}</Text>
                  <Text style={[styles.goalName, { color: colors.text }]} numberOfLines={1}>
                    {goal.text}
                  </Text>
                </View>
                {goal.tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskRow, { borderTopColor: colors.border }]}
                    onPress={() => {
                      if (task.isLinked) return;
                      onClose();
                      onSelectGoalTask(goal.id, task);
                    }}
                    activeOpacity={task.isLinked ? 1 : 0.6}
                  >
                    <View style={styles.taskInfo}>
                      <Text
                        style={[
                          styles.taskName,
                          { color: task.isLinked ? colors.textMuted : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {task.name}
                      </Text>
                      {(task.subtasks || []).length > 0 && (
                        <Text style={[styles.taskMeta, { color: colors.textMuted }]}>
                          {task.subtasks.length} sub-task{task.subtasks.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                    {task.isLinked ? (
                      <View style={[styles.badge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>Linked</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>Import</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Imported tasks sync completion with the weekly goal
            </Text>
          </>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  goalSection: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    gap: 10,
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskMeta: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
