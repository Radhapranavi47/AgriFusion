import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!phone.trim() || !password) {
      setError(t('enterPhonePassword'));
      return;
    }
    setIsLoading(true);
    try {
      await login(phone.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegister = () => {
    setError(null);
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logo}>{t('agriFusion')}</Text>
            </View>
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('welcomeBack')}</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>{t('phone')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('phonePlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setError(null);
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              autoCorrect={false}
            />

            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.btnPressed,
                isLoading && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>{t('signIn')}</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && styles.btnPressed]}
            onPress={handleGoToRegister}
            disabled={isLoading}>
            <Text style={styles.registerBtnText}>
              {t('noAccount')} <Text style={styles.registerHighlight}>{t('signUp')}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    ...SHADOW,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: COLORS.high,
    fontSize: 14,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 48,
  },
  loginBtnDisabled: {
    opacity: 0.8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  registerBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  registerHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
