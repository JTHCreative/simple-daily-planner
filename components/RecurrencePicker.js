import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RECURRENCE_TYPES } from '../utils/recurrence';
import { useTheme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const TYPE_LABELS = {
  [RECURRENCE_TYPES.ONCE]: 'Once',
  [RECURRENCE_TYPES.DAILY]: 'Daily',
};

export default function RecurrencePicker({ value, onChange }) {
  const colors = useTheme();
  const type = value?.type || RECURRENCE_TYPES.ONCE;
  const inheritTasks = value?.inheritTasks ?? false;
  const isDaily = type === RECURRENCE_TYPES.DAILY;

  const handleTypeChange = (key) => {
    const next = { type: key };
    if (key === RECURRENCE_TYPES.DAILY) {
      next.inheritTasks = inheritTasks;
    }
    onChange(next);
  };

  const handleToggleInherit = () => {
    if (!isDaily) return;
    onChange({ ...value, inheritTasks: !inheritTasks });
  };

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
              onPress={() => handleTypeChange(key)}
            >
              <Text style={[styles.typeText, { color: isActive ? '#fff' : colors.text }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <TouchableOpacity
        style={[styles.checkboxRow, !isDaily && styles.checkboxRowDisabled]}
        onPress={handleToggleInherit}
        disabled={!isDaily}
        activeOpacity={isDaily ? 0.6 : 1}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: !isDaily ? colors.textMuted : inheritTasks ? colors.primary : colors.border,
              backgroundColor: inheritTasks && isDaily ? colors.primary : 'transparent',
            },
          ]}
        >
          {inheritTasks && isDaily && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.checkboxLabelWrap}>
          <Text style={[styles.checkboxLabel, { color: isDaily ? colors.text : colors.textMuted }]}>
            Repeat tasks with group
          </Text>
          <Text style={[styles.checkboxHint, { color: isDaily ? colors.textSecondary : colors.textMuted }]}>
            {isDaily
              ? inheritTasks
                ? 'Tasks inside will repeat daily with this group'
                : 'Group repeats daily but starts empty each day'
              : 'Only available for daily repeating groups'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
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
  divider: {
    height: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxRowDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxLabelWrap: {
    flex: 1,
    gap: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxHint: {
    fontSize: 12,
  },
});
