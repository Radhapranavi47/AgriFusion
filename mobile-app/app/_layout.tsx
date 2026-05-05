import '@/i18n';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Auth protection: index.tsx redirects to login when !token; (tabs)/_layout
 * redirects to login when !token; (auth)/_layout redirects to dashboard when token.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
    <AuthProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="field" options={{ headerShown: false }} />
        <Stack.Screen name="farm-map" options={{ title: 'Farm Map' }} />
        <Stack.Screen
          name="advisory-details"
          options={{ title: 'Advisory Details' }}
        />
        <Stack.Screen name="advisory" options={{ headerShown: false }} />
        <Stack.Screen
          name="weekly-report"
          options={{ title: 'Weekly Report' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
