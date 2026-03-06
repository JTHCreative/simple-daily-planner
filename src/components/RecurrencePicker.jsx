import { RECURRENCE_TYPES, DAY_NAMES } from '../utils/recurrence';
import './RecurrencePicker.css';

export default function RecurrencePicker({ value, onChange }) {
  const type = value?.type || RECURRENCE_TYPES.ONCE;
  const days = value?.days || [];

  const setType = (newType) => {
    if (newType === RECURRENCE_TYPES.CUSTOM) {
      onChange({ type: newType, days: [] });
    } else {
      onChange({ type: newType });
    }
  };

  const toggleDay = (dayIndex) => {
    const newDays = days.includes(dayIndex)
      ? days.filter(d => d !== dayIndex)
      : [...days, dayIndex].sort();
    onChange({ type: RECURRENCE_TYPES.CUSTOM, days: newDays });
  };

  return (
    <div className="recurrence-picker">
      <div className="recurrence-types">
        {Object.entries({
          [RECURRENCE_TYPES.ONCE]: 'Once',
          [RECURRENCE_TYPES.DAILY]: 'Daily',
          [RECURRENCE_TYPES.WEEKLY]: 'Weekly',
          [RECURRENCE_TYPES.CUSTOM]: 'Custom',
        }).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`recurrence-type ${type === key ? 'active' : ''}`}
            onClick={() => setType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {type === RECURRENCE_TYPES.CUSTOM && (
        <div className="day-selector">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              type="button"
              className={`day-btn ${days.includes(i) ? 'active' : ''}`}
              onClick={() => toggleDay(i)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
