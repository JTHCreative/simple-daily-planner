import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { shouldShowOnDate } from '../utils/recurrence';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import GroupForm from './GroupForm';
import GroupArrange from './GroupArrange';
import SubtaskEditForm from './SubtaskEditForm';
import { useTheme } from '../utils/theme';

// Icon center: group padding (14) + half icon width (22) = 36
const LINE_OFFSET = 36;

export default function Timeline({ selectedDate }) {
  const colors = useTheme();
  const { state } = usePlanner();
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroupName, setActiveGroupName] = useState('');
  const [activeGroupRecurrence, setActiveGroupRecurrence] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [subtaskFormOpen, setSubtaskFormOpen] = useState(false);
  const [editSubtaskGroupId, setEditSubtaskGroupId] = useState(null);
  const [editSubtaskTaskId, setEditSubtaskTaskId] = useState(null);
  const [editSubtask, setEditSubtask] = useState(null);

  const dateKey = selectedDate.toISOString().split('T')[0];

  const visibleGroups = state.groups.filter((g) =>
    shouldShowOnDate(g.recurrence, selectedDate, g.createdDate)
  );

  const openAddTask = (groupId, groupName, groupRecurrence) => {
    setActiveGroupId(groupId);
    setActiveGroupName(groupName);
    setActiveGroupRecurrence(groupRecurrence);
    setEditTask(null);
    setTaskFormOpen(true);
  };

  const openEditTask = (groupId, groupName, task, groupRecurrence) => {
    setActiveGroupId(groupId);
    setActiveGroupName(groupName);
    setActiveGroupRecurrence(groupRecurrence);
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

  const openEditSubtask = (groupId, task, subtask) => {
    setEditSubtaskGroupId(groupId);
    setEditSubtaskTaskId(task.id);
    setEditSubtask(subtask);
    setSubtaskFormOpen(true);
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
        const isGroupDaily = group.recurrence?.type === 'daily';
        const visibleTasks = isGroupDaily
          ? group.tasks.filter((t) => {
              // Tasks default to 'daily' (inherit group recurrence)
              if (!t.recurrence || t.recurrence === 'daily') return true;
              // One-off tasks only show on their created date
              return t.createdDate === dateKey;
            })
          : group.tasks;
        const isLast = index === visibleGroups.length - 1;

        return (
          <View key={group.id}>
            {/* Group header card */}
            <TouchableOpacity
              style={[styles.groupHeader, { backgroundColor: colors.surface }]}
              onPress={() => openEditGroup(group)}
              onLongPress={() => setArrangeOpen(true)}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={[styles.groupIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.groupEmoji}>{icon.emoji}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                {group.description ? (
                  <Text style={[styles.groupDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {group.description}
                  </Text>
                ) : (
                  <Text style={[styles.groupCount, { color: colors.textMuted }]}>
                    {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.addTaskBtn, { backgroundColor: colors.primary }]}
                onPress={() => openAddTask(group.id, group.name, group.recurrence)}
              >
                <Text style={styles.addTaskPlus}>+</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Task list area with timeline line on the left under the icon */}
            <View style={styles.taskArea}>
              {/* Vertical timeline line — runs full height of task area */}
              <View
                style={[
                  styles.timelineLine,
                  {
                    left: LINE_OFFSET,
                    backgroundColor: colors.primary,
                  },
                ]}
              />

              {/* Tasks */}
              <View style={styles.taskList}>
                {visibleTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    groupId={group.id}
                    dateKey={dateKey}
                    onEdit={(t) => openEditTask(group.id, group.name, t, group.recurrence)}
                    onEditSubtask={(t, st) => openEditSubtask(group.id, t, st)}
                  />
                ))}
                {visibleTasks.length === 0 && (
                  <TouchableOpacity
                    style={[styles.addFirstTask, { borderColor: colors.border }]}
                    onPress={() => openAddTask(group.id, group.name, group.recurrence)}
                  >
                    <Text style={[styles.addFirstText, { color: colors.textMuted }]}>+ Add a task</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Connector line to next group */}
            {!isLast && (
              <View style={styles.connectorWrap}>
                <View
                  style={[
                    styles.connector,
                    {
                      left: LINE_OFFSET,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            )}

            {/* Fade-out tail on last group */}
            {isLast && (
              <View style={styles.tailWrap}>
                <View style={[styles.tailSegment, { left: LINE_OFFSET, backgroundColor: colors.primary, opacity: 0.6 }]} />
                <View style={[styles.tailSegment, { left: LINE_OFFSET, backgroundColor: colors.primary, opacity: 0.35 }]} />
                <View style={[styles.tailSegment, { left: LINE_OFFSET, backgroundColor: colors.primary, opacity: 0.15 }]} />
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
        selectedDate={selectedDate}
      />
      <TaskForm
        visible={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        groupId={activeGroupId}
        groupName={activeGroupName}
        groupRecurrence={activeGroupRecurrence}
        editTask={editTask}
        selectedDate={selectedDate}
      />
      <GroupArrange
        visible={arrangeOpen}
        onClose={() => setArrangeOpen(false)}
        selectedDate={selectedDate}
      />
      <SubtaskEditForm
        visible={subtaskFormOpen}
        onClose={() => setSubtaskFormOpen(false)}
        groupId={editSubtaskGroupId}
        taskId={editSubtaskTaskId}
        editSubtask={editSubtask}
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
  groupDesc: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
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
  taskArea: {
    position: 'relative',
    paddingVertical: 6,
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  taskList: {
    paddingLeft: 58,
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
  connectorWrap: {
    position: 'relative',
    height: 20,
  },
  connector: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  tailWrap: {
    position: 'relative',
    paddingTop: 2,
  },
  tailSegment: {
    width: 2,
    height: 8,
    marginBottom: 2,
    marginLeft: -1,
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
