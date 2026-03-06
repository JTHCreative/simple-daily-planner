export const RECURRENCE_TYPES = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  CUSTOM: 'custom',
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function shouldShowOnDate(recurrence, date) {
  if (!recurrence || recurrence.type === RECURRENCE_TYPES.ONCE) {
    return true;
  }

  const dayOfWeek = date.getDay();

  switch (recurrence.type) {
    case RECURRENCE_TYPES.DAILY:
      return true;
    case RECURRENCE_TYPES.WEEKLY:
      return dayOfWeek === (recurrence.dayOfWeek ?? date.getDay());
    case RECURRENCE_TYPES.CUSTOM:
      return (recurrence.days || []).includes(dayOfWeek);
    default:
      return true;
  }
}

export function getRecurrenceLabel(recurrence) {
  if (!recurrence || recurrence.type === RECURRENCE_TYPES.ONCE) return 'One time';
  if (recurrence.type === RECURRENCE_TYPES.DAILY) return 'Daily';
  if (recurrence.type === RECURRENCE_TYPES.WEEKLY) return 'Weekly';
  if (recurrence.type === RECURRENCE_TYPES.CUSTOM) {
    const days = (recurrence.days || []).map(d => DAY_NAMES[d]).join(', ');
    return days || 'Custom';
  }
  return 'One time';
}
