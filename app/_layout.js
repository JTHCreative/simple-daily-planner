import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlannerProvider } from '../context/PlannerContext';

export default function RootLayout() {
  return (
    <PlannerProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </PlannerProvider>
  );
}
