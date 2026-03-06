import { ICON_OPTIONS } from '../utils/icons';
import './IconPicker.css';

export default function IconPicker({ selected, onSelect }) {
  return (
    <div className="icon-picker">
      {ICON_OPTIONS.map(icon => (
        <button
          key={icon.id}
          className={`icon-option ${selected === icon.id ? 'selected' : ''}`}
          onClick={() => onSelect(icon.id)}
          type="button"
          title={icon.label}
        >
          {icon.emoji}
        </button>
      ))}
    </div>
  );
}
