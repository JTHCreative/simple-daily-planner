import { useColorScheme } from 'react-native';

const lightColors = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.1)',
  bg: '#f8f9fb',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.1)',
};

const darkColors = {
  primary: '#818cf8',
  primaryLight: 'rgba(129, 140, 248, 0.12)',
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  danger: '#f87171',
  dangerLight: 'rgba(248, 113, 113, 0.12)',
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
