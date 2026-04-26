import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../utils/theme';
import { useSettings } from '../context/PlannerContext';
import { getEffectiveToday } from '../utils/dateHelpers';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getWeekKeyFromDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
  return weekStart.toISOString().split('T')[0];
}

export default function WeekPickerModal({ visible, onClose, currentWeekKey, onSelect }) {
  const colors = useTheme();
  const settings = useSettings();

  // Initialize view to the current selected week's month
  const initialDate = currentWeekKey ? new Date(`${currentWeekKey}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const today = getEffectiveToday(settings?.timezone);
  const todayWeekKey = getWeekKeyFromDate(today);

  // Build a list of week-rows for the view month. Each row is a Sunday-based week
  // that contains at least one day from the current view month.
  const monthFirst = new Date(viewYear, viewMonth, 1);
  const monthLast = new Date(viewYear, viewMonth + 1, 0);
  const firstWeekStart = new Date(monthFirst);
  firstWeekStart.setDate(monthFirst.getDate() - monthFirst.getDay());

  const rows = [];
  const cursor = new Date(firstWeekStart);
  while (cursor <= monthLast) {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + i);
      weekDays.push(d);
    }
    rows.push(weekDays);
    cursor.setDate(cursor.getDate() + 7);
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (weekStart) => {
    const wk = getWeekKeyFromDate(weekStart);
    onSelect(wk);
    onClose();
  };

  const goThisWeek = () => {
    onSelect(todayWeekKey);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <View style={[styles.chevron, styles.chevronLeft, { borderColor: colors.text }]} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <View style={[styles.chevron, styles.chevronRight, { borderColor: colors.text }]} />
            </TouchableOpacity>
          </View>

          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label) => (
              <Text key={label} style={[styles.dayLabel, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {rows.map((week, ri) => {
            const weekKey = getWeekKeyFromDate(week[0]);
            const isSelectedWeek = weekKey === currentWeekKey;
            const isCurrentWeek = weekKey === todayWeekKey;
            return (
              <TouchableOpacity
                key={ri}
                onPress={() => handleSelect(week[0])}
                activeOpacity={0.7}
                style={[
                  styles.weekRow,
                  isSelectedWeek && { backgroundColor: colors.primary },
                  isCurrentWeek && !isSelectedWeek && { backgroundColor: colors.primaryLight },
                ]}
              >
                {week.map((d, ci) => {
                  const isInMonth = d.getMonth() === viewMonth;
                  const dayColor = isSelectedWeek
                    ? '#fff'
                    : isInMonth
                      ? colors.text
                      : colors.textMuted;
                  return (
                    <View key={ci} style={styles.dayCell}>
                      <Text style={[styles.dayText, { color: dayColor }]}>{d.getDate()}</Text>
                    </View>
                  );
                })}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={goThisWeek} style={[styles.todayBtn, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>Go to This Week</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 340,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    width: 36,
    height: 36,
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
  },
  chevronRight: {
    transform: [{ rotate: '45deg' }],
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  todayBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
