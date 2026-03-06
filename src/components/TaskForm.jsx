import { useState, useEffect } from 'react';
import Modal from './Modal';
import RecurrencePicker from './RecurrencePicker';
import { usePlanner } from '../context/PlannerContext';
import './FormStyles.css';

export default function TaskForm({ open, onClose, groupId, editTask }) {
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [recurrence, setRecurrence] = useState({ type: 'once' });

  useEffect(() => {
    if (editTask) {
      setName(editTask.name);
      setRecurrence(editTask.recurrence || { type: 'once' });
    } else {
      setName('');
      setRecurrence({ type: 'once' });
    }
  }, [editTask, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { groupId, taskId: editTask.id, updates: { name: name.trim(), recurrence } },
      });
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: { groupId, name: name.trim(), recurrence },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editTask) {
      dispatch({ type: 'DELETE_TASK', payload: { groupId, taskId: editTask.id } });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editTask ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-label">
          Task Name
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Read Bible"
            autoFocus
          />
        </label>

        <label className="form-label">Repeats</label>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

        <div className="form-actions">
          {editTask && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {editTask ? 'Save' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
