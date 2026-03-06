import { useLongPress } from '../hooks/useLongPress';
import { usePlanner } from '../context/PlannerContext';
import { getRecurrenceLabel } from '../utils/recurrence';
import './TaskItem.css';

export default function TaskItem({ task, groupId, dateKey, onEdit }) {
  const { state, dispatch } = usePlanner();
  const isCompleted = state.completedTasks[dateKey]?.[task.id] || false;

  const handleTap = () => {
    dispatch({ type: 'TOGGLE_TASK', payload: { taskId: task.id, dateKey } });
  };

  const handleLongPress = () => {
    onEdit(task);
  };

  const pressHandlers = useLongPress(handleLongPress, handleTap);

  const recLabel = getRecurrenceLabel(task.recurrence);

  return (
    <div className={`task-item ${isCompleted ? 'completed' : ''}`} {...pressHandlers}>
      <div className={`task-checkbox ${isCompleted ? 'checked' : ''}`}>
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="task-info">
        <span className={`task-name ${isCompleted ? 'struck' : ''}`}>{task.name}</span>
        {recLabel !== 'One time' && (
          <span className="task-recurrence">{recLabel}</span>
        )}
      </div>
    </div>
  );
}
