import './DateHeader.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DateHeader({ selectedDate, onDateChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = selectedDate.toDateString() === today.toDateString();

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const goToday = () => {
    onDateChange(new Date(today));
  };

  return (
    <div className="date-header">
      <button className="date-nav" onClick={goBack}>&lt;</button>
      <div className="date-center" onClick={goToday}>
        <span className="date-day">{DAYS[selectedDate.getDay()]}</span>
        <span className="date-full">
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
        </span>
        {isToday && <span className="today-badge">Today</span>}
      </div>
      <button className="date-nav" onClick={goForward}>&gt;</button>
    </div>
  );
}
