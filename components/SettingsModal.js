import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings, useDispatch } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsModal({ visible, onClose }) {
  const colors = useTheme();
  const settings = useSettings() || {};
  const dispatch = useDispatch();
  const [name, setName] = useState(settings.userName || '');

  const currentMode = settings.themeMode || 'system';

  const handleClose = () => {
    const trimmed = name.trim();
    if (trimmed !== (settings.userName || '')) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: trimmed } });
    }
    onClose();
  };

  const setThemeMode = (mode) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { themeMode: mode } });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={[styles.doneBtn, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Name Setting */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR NAME</Text>
            <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={handleClose}
                autoCapitalize="words"
              />
              {name.length > 0 && (
                <TouchableOpacity onPress={() => setName('')} hitSlop={8}>
                  <View style={[styles.clearBtn, { backgroundColor: colors.textMuted }]}>
                    <Text style={styles.clearBtnText}>×</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              {name.trim() ? `Header will show "${name.trim()}'s Planner"` : 'Leave empty to show "My Planner"'}
            </Text>
          </View>

          {/* Theme Setting */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
            <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {THEME_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.themeOption,
                    currentMode === opt.value && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setThemeMode(opt.value)}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: currentMode === opt.value ? '#fff' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  doneBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginLeft: 4,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
  themeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
