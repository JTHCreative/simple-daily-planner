import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RECURRENCE_TYPES } from '../utils/recurrence';
import { useTheme } from '../utils/theme';

const TYPE_LABELS = {
  [RECURRENCE_TYPES.ONCE]: 'Once',
  [RECURRENCE_TYPES.DAILY]: 'Daily',
};

export default function RecurrencePicker({ value, onChange }) {
  const colors = useTheme();
  const type = value?.type || RECURRENCE_TYPES.ONCE;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.types}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const isActive = type === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.background,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onChange({ type: key })}
            >
              <Text style={[styles.typeText, { color: isActive ? '#fff' : colors.text }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {type === RECURRENCE_TYPES.DAILY
          ? 'This group will appear every day'
          : 'This group will only appear on the day it was created'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
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
  hint: {
    fontSize: 12,
  },
});
