import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../utils/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarModal({ visible, onClose, selectedDate, onSelect }) {
  const colors = useTheme();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
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

  const handleSelect = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    onSelect(d);
    onClose();
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    onSelect(d);
    onClose();
  };

  const isSelected = (day) =>
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Month/year nav */}
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

          {/* Day labels */}
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label) => (
              <Text key={label} style={[styles.dayLabel, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((day, ci) => (
                <TouchableOpacity
                  key={ci}
                  style={[
                    styles.cell,
                    isSelected(day) && { backgroundColor: colors.primary },
                    isToday(day) && !isSelected(day) && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => day && handleSelect(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text
                      style={[
                        styles.cellText,
                        { color: isSelected(day) ? '#fff' : colors.text },
                      ]}
                    >
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              {/* Pad last row */}
              {row.length < 7 &&
                Array(7 - row.length)
                  .fill(null)
                  .map((_, i) => <View key={`pad-${i}`} style={styles.cell} />)}
            </View>
          ))}

          {/* Today button */}
          <TouchableOpacity onPress={goToday} style={[styles.todayBtn, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>Go to Today</Text>
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
    width: 320,
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
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    margin: 1,
  },
  cellText: {
    fontSize: 14,
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
