import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { usePlanner } from '../context/PlannerContext';
import { useTheme } from '../utils/theme';

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export default function WeeklyGoals({ selectedDate }) {
  const colors = useTheme();
  const { state, dispatch } = usePlanner();
  const [newGoal, setNewGoal] = useState('');

  const weekKey = getWeekKey(selectedDate);
  const goals = state.weeklyGoals.filter((g) => g.weekKey === weekKey);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    dispatch({ type: 'ADD_WEEKLY_GOAL', payload: { text: newGoal.trim(), weekKey } });
    setNewGoal('');
  };

  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Goals</Text>
        <View style={[styles.progressBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {completedCount}/{goals.length}
          </Text>
        </View>
      </View>

      {goals.length > 0 && (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              style={({ pressed }) => [
                styles.goalItem,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => dispatch({ type: 'TOGGLE_WEEKLY_GOAL', payload: goal.id })}
            >
              <View
                style={[
                  styles.dot,
                  {
                    borderColor: goal.completed ? colors.primary : colors.border,
                    backgroundColor: goal.completed ? colors.primary : 'transparent',
                  },
                ]}
              >
                {goal.completed && <Text style={styles.dotCheck}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.goalText,
                  {
                    color: goal.completed ? colors.textSecondary : colors.text,
                    textDecorationLine: goal.completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {goal.text}
              </Text>
              <TouchableOpacity
                onPress={() => dispatch({ type: 'DELETE_WEEKLY_GOAL', payload: goal.id })}
                style={styles.deleteBtn}
              >
                <Text style={[styles.deleteText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={newGoal}
          onChangeText={setNewGoal}
          placeholder="Add a weekly goal..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary, opacity: newGoal.trim() ? 1 : 0.5 }]}
          onPress={addGoal}
          disabled={!newGoal.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  goalText: {
    flex: 1,
    fontSize: 15,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginTop: -1,
  },
});
