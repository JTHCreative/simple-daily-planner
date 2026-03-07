import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';
import DateHeader from '../components/DateHeader';
import Timeline from '../components/Timeline';
import WeeklyGoals from '../components/WeeklyGoals';
import SwipeableDay from '../components/SwipeableDay';
import SettingsModal from '../components/SettingsModal';
import { useSettings } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

export default function HomeScreen() {
  const colors = useTheme();
  const settings = useSettings();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState('daily');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const userName = settings?.userName || '';
  const headerTitle = userName ? `${userName}'s Planner` : 'My Planner';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBg }]}>
        <View style={styles.headerLeft}>
          <View style={styles.appIcon}>
            <Svg width={28} height={28} viewBox="0 0 1024 1024">
              <Circle cx="512" cy="512" r="420" fill={colors.headerIcon} />
              <Circle
                cx="512"
                cy="512"
                r="280"
                fill="none"
                stroke={colors.headerBg}
                strokeWidth="48"
                strokeLinecap="round"
              />
              <Polyline
                points="380,520 470,620 644,420"
                fill="none"
                stroke={colors.headerBg}
                strokeWidth="52"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={[styles.headerTitle, { color: colors.headerText }]} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn} hitSlop={8}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="3" stroke={colors.headerIcon} strokeWidth="2" />
            <Polyline
              points="12,2 13.5,5"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="12,22 10.5,19"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="4.93,4.93 7.05,7.46"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="19.07,19.07 16.95,16.54"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="2,12 5,10.5"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="22,12 19,13.5"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="4.93,19.07 7.46,16.95"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Polyline
              points="19.07,4.93 16.54,7.05"
              stroke={colors.headerIcon}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Tabs below header */}
      <View style={[styles.tabs, { backgroundColor: colors.bg }]}>
        <TouchableOpacity
          style={[styles.tab, view === 'daily' && { backgroundColor: colors.primary }]}
          onPress={() => setView('daily')}
        >
          <Text style={[styles.tabText, { color: view === 'daily' ? '#fff' : colors.textMuted }]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'goals' && { backgroundColor: colors.primary }]}
          onPress={() => setView('goals')}
        >
          <Text style={[styles.tabText, { color: view === 'goals' ? '#fff' : colors.textMuted }]}>
            Weekly Goals
          </Text>
        </TouchableOpacity>
      </View>

      <DateHeader selectedDate={selectedDate} onDateChange={setSelectedDate} mode={view === 'goals' ? 'weekly' : 'daily'} />

      {view === 'goals' ? (
        <SwipeableDay selectedDate={selectedDate} onDateChange={setSelectedDate} step={7}>
          {(date) => (
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <WeeklyGoals selectedDate={date} />
            </ScrollView>
          )}
        </SwipeableDay>
      ) : (
        <SwipeableDay selectedDate={selectedDate} onDateChange={setSelectedDate}>
          {(date) => (
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Timeline selectedDate={date} />
            </ScrollView>
          )}
        </SwipeableDay>
      )}

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
});
