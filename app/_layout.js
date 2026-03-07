import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlannerProvider, useSettings } from '../context/PlannerContext';
import { ThemeModeProvider, useIsDark } from '../utils/theme';
import SplashScreen from '../components/SplashScreen';
import { requestNotificationPermissions } from '../utils/notifications';

function AppContent({ onSplashFinish, showSplash }) {
  const settings = useSettings();
  const themeMode = settings?.themeMode || 'system';
  const isDark = useIsDark();
  const userName = settings?.userName || '';

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={onSplashFinish} userName={userName} />
      </>
    );
  }

  return (
    <ThemeModeProvider value={themeMode}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeModeProvider>
  );
}

function ThemedApp() {
  const [showSplash, setShowSplash] = useState(true);
  const settings = useSettings();
  const themeMode = settings?.themeMode || 'system';

  // Request notification permissions once on launch (non-blocking)
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ThemeModeProvider value={themeMode}>
      <AppContent
        showSplash={showSplash}
        onSplashFinish={() => setShowSplash(false)}
      />
    </ThemeModeProvider>
  );
}

export default function RootLayout() {
  return (
    <PlannerProvider>
      <ThemedApp />
    </PlannerProvider>
  );
}
