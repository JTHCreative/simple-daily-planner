import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings, useDispatch, useHomeCenterSync, getHomeCenterSettings } from '../context/PlannerContext';
import { fetchHomeCenterSections } from '../utils/homeCenter';
import { useTheme } from '../utils/theme';
import { getDeviceTimezone } from '../utils/dateHelpers';
import TimezonePicker from './TimezonePicker';

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
  const [tzPickerOpen, setTzPickerOpen] = useState(false);

  const { syncing, sync } = useHomeCenterSync();
  const hc = getHomeCenterSettings(settings);
  const [hcSections, setHcSections] = useState(null); // null = loading / unavailable

  // Load Home Center's goal lists for the picker whenever settings opens.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchHomeCenterSections()
      .then((list) => !cancelled && setHcSections(list))
      .catch(() => !cancelled && setHcSections(null));
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const setHomeCenter = (patch, resync = false) => {
    dispatch({ type: 'UPDATE_HOME_CENTER', payload: patch });
    if (resync) sync({ force: true, overrides: patch });
  };

  const toggleHcSection = (id) => {
    const all = (hcSections || []).map((x) => x.id);
    const current = hc.sectionIds || all;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setHomeCenter({ sectionIds: next }, true);
  };

  const lastSynced = hc.lastSyncedAt
    ? new Date(hc.lastSyncedAt).toLocaleString([], {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Never';

  const currentMode = settings.themeMode || 'system';
  const deviceTz = getDeviceTimezone();

  const handleClose = () => {
    const trimmed = name.trim();
    if (trimmed !== (settings.userName || '')) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: trimmed } });
    }
    onClose();
  };

  const handleSelectTimezone = (tz) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { timezone: tz } });
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

        <ScrollView contentContainerStyle={styles.content}>
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

          {/* Timezone Setting */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TIMEZONE</Text>
            <TouchableOpacity
              style={[styles.tzSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setTzPickerOpen(true)}
            >
              <View style={styles.tzSelectorInfo}>
                <Text style={[styles.tzSelectorLabel, { color: colors.text }]}>
                  {settings.timezone
                    ? settings.timezone.replace(/_/g, ' ')
                    : `Auto (${deviceTz ? deviceTz.replace(/_/g, ' ') : 'unknown'})`}
                </Text>
              </View>
              <View style={[styles.tzChevron, { borderColor: colors.textMuted }]} />
            </TouchableOpacity>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              Days reset at 3:00 AM local time.
            </Text>
          </View>

          {/* Home Center Sync */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HOME CENTER GOALS</Text>
            <View style={[styles.hcCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.hcRow}>
                <Text style={[styles.hcLabel, { color: colors.text }]}>Pull weekly goals daily</Text>
                <Switch
                  value={hc.enabled}
                  onValueChange={(v) => setHomeCenter({ enabled: v }, v)}
                  trackColor={{ true: colors.primary }}
                />
              </View>

              {hc.enabled && (
                <>
                  <View style={[styles.hcDivider, { backgroundColor: colors.border }]} />
                  {hcSections === null ? (
                    <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Loading goal lists…</Text>
                  ) : (
                    hcSections.map((sec) => {
                      const checked = !hc.sectionIds || hc.sectionIds.includes(sec.id);
                      return (
                        <Pressable key={sec.id} style={styles.hcRow} onPress={() => toggleHcSection(sec.id)}>
                          <Text style={[styles.hcLabel, { color: colors.text }]}>{sec.title}</Text>
                          <View
                            style={[
                              styles.hcCheck,
                              {
                                borderColor: checked ? colors.primary : colors.border,
                                backgroundColor: checked ? colors.primary : 'transparent',
                              },
                            ]}
                          >
                            {checked && <Text style={styles.hcCheckMark}>✓</Text>}
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                  <View style={[styles.hcDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity
                    style={styles.hcRow}
                    onPress={() => sync({ force: true })}
                    disabled={syncing}
                  >
                    <Text style={[styles.hcLabel, { color: colors.primary, fontWeight: '600' }]}>Sync now</Text>
                    {syncing && <ActivityIndicator size="small" color={colors.primary} />}
                  </TouchableOpacity>
                </>
              )}
            </View>
            <Text style={[styles.sectionHint, { color: hc.lastError ? colors.danger : colors.textMuted }]}>
              {hc.lastError
                ? `Couldn't reach Home Center (${hc.lastError}). Will retry automatically.`
                : `Last synced: ${lastSynced}. This week's goals are pulled once a day when you open the app.`}
            </Text>
          </View>

          <TimezonePicker
            visible={tzPickerOpen}
            onClose={() => setTzPickerOpen(false)}
            onSelect={handleSelectTimezone}
            currentTz={settings.timezone}
            deviceTz={deviceTz}
          />
        </ScrollView>
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
  tzSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tzSelectorInfo: {
    flex: 1,
  },
  tzSelectorLabel: {
    fontSize: 16,
  },
  hcCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  hcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 44,
  },
  hcLabel: {
    fontSize: 16,
    flex: 1,
  },
  hcDivider: {
    height: 1,
  },
  hcCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hcCheckMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  tzChevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginRight: 4,
  },
});
