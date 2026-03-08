import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';

function getAllTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older engines
    return [
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
      'America/Chicago', 'America/Denver', 'America/Halifax', 'America/Lima',
      'America/Los_Angeles', 'America/Mexico_City', 'America/New_York',
      'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo', 'America/Toronto',
      'America/Vancouver', 'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dhaka',
      'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Istanbul', 'Asia/Jakarta',
      'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Manila',
      'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore',
      'Asia/Taipei', 'Asia/Tehran', 'Asia/Tokyo', 'Atlantic/Reykjavik',
      'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
      'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels',
      'Europe/Dublin', 'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Lisbon',
      'Europe/London', 'Europe/Madrid', 'Europe/Moscow', 'Europe/Oslo',
      'Europe/Paris', 'Europe/Prague', 'Europe/Rome', 'Europe/Stockholm',
      'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich',
      'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu',
      'US/Alaska', 'US/Central', 'US/Eastern', 'US/Hawaii', 'US/Mountain', 'US/Pacific',
      'UTC',
    ];
  }
}

const ALL_TIMEZONES = getAllTimezones();

function getUtcOffset(tz) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(new Date());
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    return offsetPart?.value || '';
  } catch {
    return '';
  }
}

export default function TimezonePicker({ visible, onClose, onSelect, currentTz, deviceTz }) {
  const colors = useTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_TIMEZONES;
    const q = search.toLowerCase();
    return ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(q));
  }, [search]);

  const handleSelect = (tz) => {
    onSelect(tz);
    setSearch('');
    onClose();
  };

  const handleAutoDetect = () => {
    onSelect(null);
    setSearch('');
    onClose();
  };

  const renderItem = ({ item: tz }) => {
    const isActive = tz === currentTz;
    const isDevice = tz === deviceTz && !currentTz;
    const offset = getUtcOffset(tz);
    return (
      <TouchableOpacity
        style={[
          styles.tzRow,
          { borderBottomColor: colors.border },
          (isActive || isDevice) && { backgroundColor: colors.primaryLight },
        ]}
        onPress={() => handleSelect(tz)}
      >
        <View style={styles.tzInfo}>
          <Text style={[styles.tzName, { color: colors.text }]} numberOfLines={1}>{tz.replace(/_/g, ' ')}</Text>
          {offset ? <Text style={[styles.tzOffset, { color: colors.textMuted }]}>{offset}</Text> : null}
        </View>
        {isActive && <Text style={[styles.tzBadge, { color: colors.primary }]}>Selected</Text>}
        {isDevice && <Text style={[styles.tzBadge, { color: colors.textMuted }]}>Auto</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Select Timezone</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[styles.cancelBtn, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search timezones..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <View style={[styles.clearBtn, { backgroundColor: colors.textMuted }]}>
                <Text style={styles.clearBtnText}>×</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-detect option */}
        <TouchableOpacity
          style={[
            styles.autoRow,
            { borderBottomColor: colors.border },
            !currentTz && { backgroundColor: colors.primaryLight },
          ]}
          onPress={handleAutoDetect}
        >
          <View style={styles.tzInfo}>
            <Text style={[styles.tzName, { color: colors.text }]}>Auto-detect</Text>
            <Text style={[styles.tzOffset, { color: colors.textMuted }]}>{deviceTz ? deviceTz.replace(/_/g, ' ') : ''}</Text>
          </View>
          {!currentTz && <Text style={[styles.tzBadge, { color: colors.primary }]}>Active</Text>}
        </TouchableOpacity>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No timezones match "{search}"</Text>
            </View>
          }
        />
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
  cancelBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
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
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tzInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tzName: {
    fontSize: 15,
    flexShrink: 1,
  },
  tzOffset: {
    fontSize: 13,
  },
  tzBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
