const DAY_RESET_HOUR = 3;

/**
 * Returns what "today" effectively is, accounting for the 3 AM day reset.
 * If the current time is before 3 AM, the previous calendar day is still "today".
 * An optional timezone override shifts the clock used for the calculation.
 */
export function getEffectiveToday(timezone) {
  const now = new Date();

  let currentHour;
  let calendarDate;

  if (timezone) {
    try {
      // Get current hour in the target timezone
      const hourFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      currentHour = parseInt(hourFmt.format(now), 10);

      // Get calendar date in the target timezone
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const y = parseInt(parts.find((p) => p.type === 'year').value, 10);
      const m = parseInt(parts.find((p) => p.type === 'month').value, 10) - 1;
      const d = parseInt(parts.find((p) => p.type === 'day').value, 10);
      calendarDate = new Date(y, m, d);
    } catch {
      // Invalid timezone — fall back to device time
      currentHour = now.getHours();
      calendarDate = new Date(now);
      calendarDate.setHours(0, 0, 0, 0);
    }
  } else {
    currentHour = now.getHours();
    calendarDate = new Date(now);
    calendarDate.setHours(0, 0, 0, 0);
  }

  if (currentHour < DAY_RESET_HOUR) {
    calendarDate.setDate(calendarDate.getDate() - 1);
  }

  return calendarDate;
}

/**
 * Returns the IANA timezone string detected from the device.
 */
export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
}
