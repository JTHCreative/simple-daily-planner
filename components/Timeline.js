import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { shouldShowOnDate } from '../utils/recurrence';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import GroupForm from './GroupForm';
import { useTheme } from '../utils/theme';

const LINE_LEFT = 20;
const LINE_WIDTH = 2;

export default function Timeline({ selectedDate }) {
  const colors = useTheme();
  const { state } = usePlanner();
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const dateKey = selectedDate.toISOString().split('T')[0];

  const visibleGroups = state.groups.filter((g) =>
    shouldShowOnDate(g.recurrence, selectedDate)
  );

  const openAddTask = (groupId) => {
    setActiveGroupId(groupId);
    setEditTask(null);
    setTaskFormOpen(true);
  };

  const openEditTask = (groupId, task) => {
    setActiveGroupId(groupId);
    setEditTask(task);
    setTaskFormOpen(true);
  };

  const openEditGroup = (group) => {
    setEditGroup(group);
    setGroupFormOpen(true);
  };

  const openAddGroup = () => {
    setEditGroup(null);
    setGroupFormOpen(true);
  };

  return (
    <View style={styles.container}>
      {visibleGroups.length === 0 && (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyPlus, { color: colors.textMuted }]}>+</Text>
          </View>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No groups yet. Add your first group to start planning your day!
          </Text>
        </View>
      )}

      {visibleGroups.map((group, index) => {
        const icon = getIconById(group.icon);
        const visibleTasks = group.tasks.filter((t) =>
          shouldShowOnDate(t.recurrence, selectedDate)
        );
        const isLast = index === visibleGroups.length - 1;

        return (
          <View key={group.id}>
            {/* Group header row */}
            <View style={styles.row}>
              {/* Timeline line segment behind the group dot */}
              <View style={styles.lineCol}>
                {index > 0 && (
                  <View
                    style={[
                      styles.lineSegmentTop,
                      { backgroundColor: colors.primary, left: LINE_LEFT - LINE_WIDTH / 2 },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.groupDot,
                    {
                      backgroundColor: colors.primary,
                      left: LINE_LEFT - 5,
                    },
                  ]}
                />
                {(visibleTasks.length > 0 || !isLast) && (
                  <View
                    style={[
                      styles.lineSegmentBottom,
                      { backgroundColor: colors.primary, left: LINE_LEFT - LINE_WIDTH / 2 },
                    ]}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.groupHeader, { backgroundColor: colors.surface }]}
                onPress={() => openEditGroup(group)}
                activeOpacity={0.7}
              >
                <View style={[styles.groupIcon, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.groupEmoji}>{icon.emoji}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                  <Text style={[styles.groupCount, { color: colors.textMuted }]}>
                    {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addTaskBtn, { backgroundColor: colors.primary }]}
                  onPress={() => openAddTask(group.id)}
                >
                  <Text style={styles.addTaskPlus}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Task rows */}
            {visibleTasks.map((task, taskIndex) => {
              const showLineBelow =
                taskIndex < visibleTasks.length - 1 || !isLast;
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  groupId={group.id}
                  dateKey={dateKey}
                  onEdit={(t) => openEditTask(group.id, t)}
                  lineColor={colors.primary}
                  showLineAbove
                  showLineBelow={showLineBelow}
                />
              );
            })}

            {/* Empty state: add first task */}
            {visibleTasks.length === 0 && (
              <View style={styles.row}>
                <View style={styles.lineCol}>
                  <View
                    style={[
                      styles.lineSegmentTop,
                      { backgroundColor: colors.primary, left: LINE_LEFT - LINE_WIDTH / 2 },
                    ]}
                  />
                  {/* Empty circle on line */}
                  <View
                    style={[
                      styles.emptyCircle,
                      {
                        borderColor: colors.border,
                        left: LINE_LEFT - 10,
                      },
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[
                        styles.lineSegmentBottom,
                        { backgroundColor: colors.primary, left: LINE_LEFT - LINE_WIDTH / 2 },
                      ]}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.addFirstTask, { borderColor: colors.border }]}
                  onPress={() => openAddTask(group.id)}
                >
                  <Text style={[styles.addFirstText, { color: colors.textMuted }]}>+ Add a task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.addGroupBtn, { borderColor: colors.border }]}
        onPress={openAddGroup}
      >
        <Text style={[styles.addGroupText, { color: colors.textSecondary }]}>+ Add Group</Text>
      </TouchableOpacity>

      <GroupForm
        visible={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        editGroup={editGroup}
      />
      <TaskForm
        visible={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        groupId={activeGroupId}
        editTask={editTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyPlus: {
    fontSize: 24,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  groupDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    marginTop: -5,
    zIndex: 1,
  },
  emptyCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
    top: '50%',
    marginTop: -10,
    zIndex: 1,
  },
  groupHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: 22,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 12,
  },
  addTaskBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskPlus: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginTop: -1,
  },
  addFirstTask: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addFirstText: {
    fontSize: 14,
  },
  addGroupBtn: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addGroupText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
