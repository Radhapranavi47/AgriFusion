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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants/theme';

const DISTRICTS = ['East Godavari', 'West Godavari', 'Krishna'] as const;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState<string>('');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !password.trim() || !district) {
      setError(t('fillAllFields'));
      return;
    }
    setIsLoading(true);
    try {
      await register(name.trim(), phone.trim(), password.trim(), district);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDistrict = (d: string) => {
    setDistrict(d);
    setShowDistrictModal(false);
    setError(null);
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
          <View style={styles.header}>
            <Text style={styles.title}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('joinAgriFusion')}</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>{t('name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('namePlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              autoCapitalize="words"
              editable={!isLoading}
            />

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
            />

            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('createPassword')}
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

            <Text style={styles.label}>{t('district')}</Text>
            <Pressable
              style={styles.dropdown}
              onPress={() => !isLoading && setShowDistrictModal(true)}>
              <Text style={[styles.dropdownText, !district && styles.dropdownPlaceholder]}>
                {district || t('selectDistrict')}
              </Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.registerBtn,
                pressed && styles.btnPressed,
                isLoading && styles.registerBtnDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.registerBtnText}>{t('signUp')}</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginLink, pressed && styles.btnPressed]}
            onPress={() => router.back()}
            disabled={isLoading}>
            <Text style={styles.loginLinkText}>{t('backToLogin')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showDistrictModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDistrictModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectDistrictTitle')}</Text>
            {DISTRICTS.map((d) => (
              <Pressable
                key={d}
                style={({ pressed }) => [
                  styles.modalOption,
                  pressed && styles.modalOptionPressed,
                  district === d && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectDistrict(d)}>
                <Text style={[styles.modalOptionText, district === d && styles.modalOptionTextSelected]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    color: COLORS.textSecondary,
  },
  dropdownChevron: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 48,
  },
  registerBtnDisabled: {
    opacity: 0.8,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modalOptionPressed: {
    opacity: 0.85,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.primary}20`,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
