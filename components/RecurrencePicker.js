import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RECURRENCE_TYPES, DAY_NAMES } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const TYPE_LABELS = {
  [RECURRENCE_TYPES.ONCE]: 'Once',
  [RECURRENCE_TYPES.DAILY]: 'Daily',
  [RECURRENCE_TYPES.WEEKLY]: 'Weekly',
  [RECURRENCE_TYPES.CUSTOM]: 'Custom',
};

export default function RecurrencePicker({ value, onChange }) {
  const colors = useTheme();
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
      ? days.filter((d) => d !== dayIndex)
      : [...days, dayIndex].sort();
    onChange({ type: RECURRENCE_TYPES.CUSTOM, days: newDays });
  };

  return (
    <View style={styles.container}>
      <View style={styles.types}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const isActive = type === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setType(key)}
            >
              <Text style={[styles.typeText, { color: isActive ? '#fff' : colors.text }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {type === RECURRENCE_TYPES.CUSTOM && (
        <View style={styles.days}>
          {DAY_NAMES.map((name, i) => {
            const isActive = days.includes(i);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayText, { color: isActive ? '#fff' : colors.text }]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  types: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  days: {
    flexDirection: 'row',
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
