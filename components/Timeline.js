import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGroups, useCompletedTasks, useDispatch, useSettings } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { shouldShowOnDate } from '../utils/recurrence';
import { getEffectiveToday } from '../utils/dateHelpers';
import Svg, { Path } from 'react-native-svg';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import GroupForm from './GroupForm';
import GroupArrange from './GroupArrange';
import SubtaskEditForm from './SubtaskEditForm';
import AddGroupChooser from './AddGroupChooser';
import TemplateList from './TemplateList';
import CompletedBanner from './CompletedBanner';
import { useTheme } from '../utils/theme';

// Icon center: group padding (14) + half icon width (22) = 36
const LINE_OFFSET = 36;

export default function Timeline({ selectedDate }) {
  const colors = useTheme();
  const groups = useGroups();
  const completedTasks = useCompletedTasks();
  const dispatch = useDispatch();
  const settings = useSettings();
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
  const [chooserOpen, setChooserOpen] = useState(false);
  const [templateListOpen, setTemplateListOpen] = useState(false);
  const [fromTemplate, setFromTemplate] = useState(null);
  const [unlockedGroups, setUnlockedGroups] = useState({});

  const dateKey = useMemo(
    () => selectedDate.toISOString().split('T')[0],
    [selectedDate]
  );

  const isPastDay = useMemo(() => {
    const today = getEffectiveToday(settings?.timezone);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return sel < today;
  }, [selectedDate, settings?.timezone]);

  const isDateHidden = useCallback((hiddenRanges, date) => {
    if (!hiddenRanges?.length) return false;
    return hiddenRanges.some((r) => date >= r.start && (!r.end || date < r.end));
  }, []);

  const visibleGroups = useMemo(
    () => groups.filter((g) => {
      if (!shouldShowOnDate(g.recurrence, selectedDate, g.createdDate)) return false;
      if (isDateHidden(g.hiddenRanges, dateKey)) return false;
      return true;
    }),
    [groups, selectedDate, dateKey, isDateHidden]
  );

  const openAddTask = useCallback((groupId, groupName, groupRecurrence) => {
    setActiveGroupId(groupId);
    setActiveGroupName(groupName);
    setActiveGroupRecurrence(groupRecurrence);
    setEditTask(null);
    setTaskFormOpen(true);
  }, []);

  const openEditTask = useCallback((groupId, groupName, task, groupRecurrence) => {
    setActiveGroupId(groupId);
    setActiveGroupName(groupName);
    setActiveGroupRecurrence(groupRecurrence);
    setEditTask(task);
    setTaskFormOpen(true);
  }, []);

  const openEditGroup = useCallback((group) => {
    setEditGroup(group);
    setFromTemplate(null);
    setGroupFormOpen(true);
  }, []);

  const openAddGroup = useCallback(() => {
    setChooserOpen(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditGroup(null);
    setFromTemplate(null);
    setGroupFormOpen(true);
  }, []);

  const handleOpenTemplateList = useCallback(() => {
    setTemplateListOpen(true);
  }, []);

  const handleSelectTemplate = useCallback((template) => {
    setEditGroup(null);
    setFromTemplate(template);
    setGroupFormOpen(true);
  }, []);

  const openEditSubtask = useCallback((groupId, task, subtask) => {
    setEditSubtaskGroupId(groupId);
    setEditSubtaskTaskId(task.id);
    setEditSubtask(subtask);
    setSubtaskFormOpen(true);
  }, []);

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
              // Hide tasks during their hidden date ranges
              if (isDateHidden(t.hiddenRanges, dateKey)) return false;
              if (!t.recurrence || t.recurrence === 'daily') return true;
              return t.createdDate === dateKey;
            })
          : group.tasks;
        const isLast = index === visibleGroups.length - 1;
        const allTasksDone =
          visibleTasks.length > 0 &&
          visibleTasks.every((t) => completedTasks[dateKey]?.[t.id]);

        return (
          <View key={group.id}>
            {/* Group header card */}
            <TouchableOpacity
              style={[styles.groupHeader, { backgroundColor: colors.groupHeaderBg, overflow: 'visible' }]}
              onPress={() => openEditGroup(group)}
              onLongPress={() => setArrangeOpen(true)}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={[styles.groupIcon, { backgroundColor: colors.groupIconBg }]}>
                <Text style={styles.groupEmoji}>{icon.emoji}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.groupHeaderText }]}>{group.name}</Text>
                {group.description ? (
                  <Text style={[styles.groupDesc, { color: colors.groupHeaderMuted }]} numberOfLines={2}>
                    {group.description}
                  </Text>
                ) : (
                  <Text style={[styles.groupCount, { color: colors.groupHeaderMuted }]}>
                    {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              {isPastDay ? (
                <TouchableOpacity
                  style={[
                    styles.unlockBtn,
                    {
                      backgroundColor: unlockedGroups[group.id] ? colors.primary : colors.surface,
                      borderColor: unlockedGroups[group.id] ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() =>
                    setUnlockedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                  }
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                      fill={unlockedGroups[group.id] ? '#fff' : colors.textMuted}
                    />
                  </Svg>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.addTaskBtn, { backgroundColor: colors.addBtnBg, borderColor: colors.addBtnBorder, borderWidth: colors.addBtnBorder !== 'transparent' ? 1.5 : 0 }]}
                  onPress={() => openAddTask(group.id, group.name, group.recurrence)}
                >
                  <Text style={[styles.addTaskPlus, { color: colors.addBtnText }]}>+ Add Task</Text>
                </TouchableOpacity>
              )}
              <CompletedBanner key={`${group.id}-${dateKey}`} isCompleted={allTasksDone} />
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
                    isCompleted={completedTasks[dateKey]?.[task.id] || false}
                    completedTasks={completedTasks}
                    dispatch={dispatch}
                    isPastDay={isPastDay}
                    isUnlocked={!!unlockedGroups[group.id]}
                    onEdit={(t) => openEditTask(group.id, group.name, t, group.recurrence)}
                    onEditSubtask={(t, st) => openEditSubtask(group.id, t, st)}
                  />
                ))}
                {visibleTasks.length === 0 && !isPastDay && (
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

      <AddGroupChooser
        visible={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onCreateNew={handleCreateNew}
        onFromTemplate={handleOpenTemplateList}
      />
      <TemplateList
        visible={templateListOpen}
        onClose={() => setTemplateListOpen(false)}
        onSelect={handleSelectTemplate}
      />
      <GroupForm
        visible={groupFormOpen}
        onClose={() => { setGroupFormOpen(false); setFromTemplate(null); }}
        editGroup={editGroup}
        selectedDate={selectedDate}
        fromTemplate={fromTemplate}
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
    paddingTop: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskPlus: {
    fontSize: 12,
    fontWeight: '600',
  },
  unlockBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
