import { Stack } from 'expo-router';

export default function FieldLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="add-field"
        options={{ title: 'Add Field' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Field Details' }}
      />
    </Stack>
  );
}
