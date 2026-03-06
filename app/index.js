import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateHeader from '../components/DateHeader';
import Timeline from '../components/Timeline';
import WeeklyGoals from '../components/WeeklyGoals';
import { useTheme } from '../utils/theme';

export default function HomeScreen() {
  const colors = useTheme();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState('daily');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Planner</Text>
      </View>

      <View style={styles.tabs}>
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

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'goals' ? (
          <WeeklyGoals selectedDate={selectedDate} />
        ) : (
          <Timeline selectedDate={selectedDate} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
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
