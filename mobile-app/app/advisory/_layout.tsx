import { Stack } from 'expo-router';

export default function AdvisoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="weekly-report"
        options={{ title: 'Weekly Report' }}
      />
    </Stack>
  );
}
