import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { useTemplates } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function AddGroupChooser({ visible, onClose, onCreateNew, onFromTemplate }) {
  const colors = useTheme();
  const templates = useTemplates();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Group">
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            onClose();
            onCreateNew();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.optionEmoji}>✨</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Create New</Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Start from scratch with an empty group
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: colors.surface, borderColor: colors.border },
            templates.length === 0 && styles.optionDisabled,
          ]}
          onPress={() => {
            if (templates.length === 0) return;
            onClose();
            onFromTemplate();
          }}
          activeOpacity={templates.length === 0 ? 1 : 0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight, opacity: templates.length === 0 ? 0.4 : 1 }]}>
            <Text style={styles.optionEmoji}>📋</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: templates.length === 0 ? colors.textMuted : colors.text }]}>
              Create from Template
            </Text>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              {templates.length === 0
                ? 'No templates saved yet. Save one from Edit Group.'
                : `${templates.length} template${templates.length !== 1 ? 's' : ''} available`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
});
