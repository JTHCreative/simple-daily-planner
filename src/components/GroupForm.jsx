import { useState, useEffect } from 'react';
import Modal from './Modal';
import IconPicker from './IconPicker';
import RecurrencePicker from './RecurrencePicker';
import { usePlanner } from '../context/PlannerContext';
import './FormStyles.css';

export default function GroupForm({ open, onClose, editGroup }) {
  const { dispatch } = usePlanner();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('sun');
  const [recurrence, setRecurrence] = useState({ type: 'once' });

  useEffect(() => {
    if (editGroup) {
      setName(editGroup.name);
      setIcon(editGroup.icon);
      setRecurrence(editGroup.recurrence || { type: 'once' });
    } else {
      setName('');
      setIcon('sun');
      setRecurrence({ type: 'once' });
    }
  }, [editGroup, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editGroup) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: { id: editGroup.id, updates: { name: name.trim(), icon, recurrence } },
      });
    } else {
      dispatch({
        type: 'ADD_GROUP',
        payload: { name: name.trim(), icon, recurrence },
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editGroup) {
      dispatch({ type: 'DELETE_GROUP', payload: editGroup.id });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editGroup ? 'Edit Group' : 'New Group'}>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-label">
          Group Name
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Morning Routine"
            autoFocus
          />
        </label>

        <label className="form-label">Icon</label>
        <IconPicker selected={icon} onSelect={setIcon} />

        <label className="form-label">Repeats</label>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

        <div className="form-actions">
          {editGroup && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {editGroup ? 'Save' : 'Add Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
