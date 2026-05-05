import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (token && user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
