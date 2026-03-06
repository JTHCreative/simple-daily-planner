import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { shouldShowOnDate } from '../utils/recurrence';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import GroupForm from './GroupForm';
import './Timeline.css';

export default function Timeline({ selectedDate }) {
  const { state } = usePlanner();
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const dateKey = selectedDate.toISOString().split('T')[0];

  const visibleGroups = state.groups.filter(g =>
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
    <div className="timeline">
      {visibleGroups.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">+</div>
          <p>No groups yet. Add your first group to start planning your day!</p>
        </div>
      )}

      {visibleGroups.map((group, index) => {
        const icon = getIconById(group.icon);
        const visibleTasks = group.tasks.filter(t =>
          shouldShowOnDate(t.recurrence, selectedDate)
        );

        return (
          <div key={group.id} className="timeline-group">
            {index > 0 && (
              <div className="timeline-connector">
                <div className="connector-line" />
              </div>
            )}

            <div className="group-header" onClick={() => openEditGroup(group)}>
              <div className="group-icon">{icon.emoji}</div>
              <div className="group-info">
                <h3 className="group-name">{group.name}</h3>
                <span className="group-count">
                  {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                className="add-task-btn"
                onClick={(e) => { e.stopPropagation(); openAddTask(group.id); }}
                title="Add task"
              >
                +
              </button>
            </div>

            <div className="group-tasks">
              {visibleTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  groupId={group.id}
                  dateKey={dateKey}
                  onEdit={(t) => openEditTask(group.id, t)}
                />
              ))}
              {visibleTasks.length === 0 && (
                <button
                  className="add-first-task"
                  onClick={() => openAddTask(group.id)}
                >
                  + Add a task
                </button>
              )}
            </div>
          </div>
        );
      })}

      <button className="add-group-btn" onClick={openAddGroup}>
        + Add Group
      </button>

      <GroupForm
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        editGroup={editGroup}
      />
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        groupId={activeGroupId}
        editTask={editTask}
      />
    </div>
  );
}
