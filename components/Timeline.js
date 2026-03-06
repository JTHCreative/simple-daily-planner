import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { shouldShowOnDate } from '../utils/recurrence';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import GroupForm from './GroupForm';
import { useTheme } from '../utils/theme';

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

        return (
          <View key={group.id}>
            {index > 0 && (
              <View style={styles.connectorWrap}>
                <View style={[styles.connector, { backgroundColor: colors.primary }]} />
              </View>
            )}

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

            <View style={[styles.taskList, { borderLeftColor: colors.primaryLight }]}>
              {visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  groupId={group.id}
                  dateKey={dateKey}
                  onEdit={(t) => openEditTask(group.id, t)}
                />
              ))}
              {visibleTasks.length === 0 && (
                <TouchableOpacity
                  style={[styles.addFirstTask, { borderColor: colors.border }]}
                  onPress={() => openAddTask(group.id)}
                >
                  <Text style={[styles.addFirstText, { color: colors.textMuted }]}>+ Add a task</Text>
                </TouchableOpacity>
              )}
            </View>
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
  connectorWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  connector: {
    width: 2,
    height: 28,
    borderRadius: 1,
  },
  groupHeader: {
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
  taskList: {
    paddingLeft: 22,
    paddingVertical: 6,
    borderLeftWidth: 2,
    marginLeft: 37,
    gap: 4,
  },
  addFirstTask: {
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
