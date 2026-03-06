import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const lightColors = {
  primary: '#dc2626',
  primaryLight: 'rgba(220, 38, 38, 0.1)',
  bg: '#f5f5f5',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#525252',
  textMuted: '#737373',
  border: '#d4d4d4',
  danger: '#dc2626',
  dangerLight: 'rgba(220, 38, 38, 0.1)',
};

const darkColors = {
  primary: '#ef4444',
  primaryLight: 'rgba(239, 68, 68, 0.12)',
  bg: '#171717',
  surface: '#262626',
  text: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  border: '#404040',
  danger: '#f87171',
  dangerLight: 'rgba(248, 113, 113, 0.12)',
};

const ThemeModeContext = createContext('system');

export const ThemeModeProvider = ThemeModeContext.Provider;

export function useTheme() {
  const themeMode = useContext(ThemeModeContext);
  const systemScheme = useColorScheme();
  const scheme = themeMode === 'light' || themeMode === 'dark' ? themeMode : systemScheme;
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useIsDark() {
  const themeMode = useContext(ThemeModeContext);
  const systemScheme = useColorScheme();
  const scheme = themeMode === 'light' || themeMode === 'dark' ? themeMode : systemScheme;
  return scheme === 'dark';
}
