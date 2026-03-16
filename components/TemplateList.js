import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { useTemplates, useDispatch } from '../context/PlannerContext';
import { getIconById } from '../utils/icons';
import { useTheme } from '../utils/theme';

export default function TemplateList({ visible, onClose, onSelect }) {
  const colors = useTheme();
  const templates = useTemplates();
  const dispatch = useDispatch();

  const handleDelete = (template) => {
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}" template?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_TEMPLATE', payload: template.id }),
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Choose Template">
      <View style={styles.container}>
        {templates.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No templates yet. Save a template from the Edit Group page.
            </Text>
          </View>
        )}
        {templates.map((template) => {
          const icon = getIconById(template.icon);
          const taskCount = template.tasks?.length || 0;
          return (
            <TouchableOpacity
              key={template.id}
              style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                onClose();
                onSelect(template);
              }}
              onLongPress={() => handleDelete(template)}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.itemEmoji}>{icon.emoji}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>{template.name}</Text>
                {template.description ? (
                  <Text style={[styles.itemDesc, { color: colors.textMuted }]} numberOfLines={1}>
                    {template.description}
                  </Text>
                ) : null}
                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                  {taskCount} task{taskCount !== 1 ? 's' : ''} · {template.recurrence?.type === 'daily' ? 'Daily' : 'Once'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: colors.dangerLight }]}
                onPress={() => handleDelete(template)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.deleteText, { color: colors.danger }]}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
