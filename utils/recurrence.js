export const RECURRENCE_TYPES = {
  ONCE: 'once',
  DAILY: 'daily',
};

export function shouldShowOnDate(recurrence, date, createdDate) {
  if (!recurrence || recurrence.type === RECURRENCE_TYPES.ONCE) {
    // "Once" items only show on their creation date
    if (createdDate) {
      return date.toISOString().split('T')[0] === createdDate;
    }
    return true;
  }

  if (recurrence.type === RECURRENCE_TYPES.DAILY) {
    return true;
  }

  // Legacy support: treat weekly/custom as daily going forward
  return true;
}

export function getRecurrenceLabel(recurrence) {
  if (!recurrence || recurrence.type === RECURRENCE_TYPES.ONCE) return 'One time';
  if (recurrence.type === RECURRENCE_TYPES.DAILY) return 'Daily';
  return 'One time';
}
