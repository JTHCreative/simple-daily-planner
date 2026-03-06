import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ICON_OPTIONS } from '../utils/icons';
import { useTheme } from '../utils/theme';

export default function IconPicker({ selected, onSelect }) {
  const colors = useTheme();

  return (
    <View style={styles.grid}>
      {ICON_OPTIONS.map((icon) => {
        const isSelected = selected === icon.id;
        return (
          <TouchableOpacity
            key={icon.id}
            style={[
              styles.item,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(icon.id)}
          >
            <Text style={styles.emoji}>{icon.emoji}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
});
