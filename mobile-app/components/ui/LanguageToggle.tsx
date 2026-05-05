import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

const STORAGE_KEY = '@agrifusion_lang_v2';

const LABELS = { en: 'EN', te: 'తెలుగు' } as const;

async function setLanguageAndPersist(lang: 'en' | 'te') {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
  } catch {
    i18n.changeLanguage(lang);
  }
}

export function LanguageToggle() {
  const { i18n: i18nFromHook } = useTranslation();
  const language = (i18nFromHook.language?.split('-')[0] as 'en' | 'te') || 'en';

  return (
    <View style={styles.pill}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          language === 'en' && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setLanguageAndPersist('en')}>
        <Text
          style={[
            styles.label,
            language === 'en' && styles.labelActive,
          ]}>
          {LABELS.en}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          language === 'te' && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setLanguageAndPersist('te')}>
        <Text
          style={[
            styles.label,
            language === 'te' && styles.labelActive,
          ]}>
          {LABELS.te}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    padding: SPACING.xs,
  },
  button: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: COLORS.card,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
