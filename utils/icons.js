export const ICON_OPTIONS = [
  { id: 'sun', emoji: '☀️', label: 'Morning' },
  { id: 'moon', emoji: '🌙', label: 'Night' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'home', emoji: '🏠', label: 'Home' },
  { id: 'briefcase', emoji: '💼', label: 'Work' },
  { id: 'book', emoji: '📖', label: 'Reading' },
  { id: 'heart', emoji: '❤️', label: 'Health' },
  { id: 'dumbbell', emoji: '💪', label: 'Exercise' },
  { id: 'utensils', emoji: '🍽️', label: 'Meals' },
  { id: 'cart', emoji: '🛒', label: 'Shopping' },
  { id: 'pencil', emoji: '✏️', label: 'Study' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'plant', emoji: '🌱', label: 'Growth' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'pray', emoji: '🙏', label: 'Prayer' },
  { id: 'run', emoji: '🏃', label: 'Running' },
  { id: 'clean', emoji: '🧹', label: 'Cleaning' },
  { id: 'code', emoji: '💻', label: 'Coding' },
  { id: 'paint', emoji: '🎨', label: 'Creative' },
  { id: 'check', emoji: '✅', label: 'Tasks' },
];

export function getIconById(id) {
  return ICON_OPTIONS.find((i) => i.id === id) || ICON_OPTIONS[0];
}
