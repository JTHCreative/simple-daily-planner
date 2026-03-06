import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';
import CalendarModal from './CalendarModal';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function formatWeekRange(date) {
  const { start, end } = getWeekRange(date);
  const sMonth = MONTHS[start.getMonth()];
  const eMonth = MONTHS[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `Week of ${sMonth} ${start.getDate()}-${end.getDate()}`;
  }
  return `Week of ${sMonth} ${start.getDate()} - ${eMonth} ${end.getDate()}`;
}

export default function DateHeader({ selectedDate, onDateChange, mode = 'daily' }) {
  const colors = useTheme();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate.toDateString() === today.toDateString();

  const isWeekly = mode === 'weekly';

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (isWeekly ? 7 : 1));
    onDateChange(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (isWeekly ? 7 : 1));
    onDateChange(d);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TouchableOpacity
        onPress={goBack}
        style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <View style={[styles.chevron, styles.chevronLeft, { borderColor: colors.text }]} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setCalendarOpen(true)} style={styles.center}>
        {isWeekly ? (
          <Text style={[styles.weekLabel, { color: colors.text }]}>
            {formatWeekRange(selectedDate)}
          </Text>
        ) : (
          <>
            <Text style={[styles.dayName, { color: colors.text }]}>
              {DAYS[selectedDate.getDay()]}
            </Text>
            <Text style={[styles.dateFull, { color: colors.textSecondary }]}>
              {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
            </Text>
          </>
        )}
        {isToday && !isWeekly && (
          <View style={[styles.todayBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.todayText, { color: colors.primary }]}>TODAY</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goForward}
        style={[styles.navBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <View style={[styles.chevron, styles.chevronRight, { borderColor: colors.text }]} />
      </TouchableOpacity>

      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelect={onDateChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  chevronLeft: {
    transform: [{ rotate: '-135deg' }],
    marginLeft: 3,
  },
  chevronRight: {
    transform: [{ rotate: '45deg' }],
    marginRight: 3,
  },
  center: {
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateFull: {
    fontSize: 13,
    marginTop: 2,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
