import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';

import { AppCard } from '@/components/cards/AppCard';
import { useLanguage } from '@/context/LanguageContext';
import { playVoiceAdvisory } from '@/utils/speech';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { RiskBadge } from '@/components/badges/RiskBadge';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface AdvisorySectionProps {
  title: string;
  message: string;
  onDone: () => void;
  onNotApplicable: () => void;
}

function AdvisorySection({
  title,
  message,
  onDone,
  onNotApplicable,
  t,
}: AdvisorySectionProps & { t: (key: string) => string }) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionMessage}>{message}</Text>
      <View style={styles.sectionButtons}>
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && styles.btnPressed]}
          onPress={onDone}>
          <Text style={styles.doneBtnText}>{t('done')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.naBtn, pressed && styles.btnPressed]}
          onPress={onNotApplicable}>
          <Text style={styles.naBtnText}>{t('notApplicable')}</Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

export default function AdvisoryDetailsScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{
    advisory?: string;
    riskLevel?: string;
    riskScore?: string;
    weather?: string;
    market?: string;
    healthStatus?: string;
  }>();

  const handleDone = () => {};
  const handleNotApplicable = () => {};

  const handlePlayVoice = () => {
    // Advisory from already-loaded route params (no API request)
    const advisoryMessage =
      params.advisory ??
      ([
        `${t('irrigation')}: ${t('irrigationMessage')}`,
        `${t('fertilizer')}: ${t('fertilizerMessage')}`,
        `${t('harvest')}: ${t('harvestMessage')}`,
        `${t('riskSummary')}: ${params.riskLevel ?? '—'} ${t('riskScoreLabel')} ${params.riskScore ?? '—'}`,
        `${t('weather')}: ${params.weather ?? t('weatherDefault')}`,
        `${t('market')}: ${params.market ?? t('marketDefault')}`,
        `${t('cropHealth')}: ${params.healthStatus ? `${t('statusLabel')} ${params.healthStatus}` : t('cropHealthDefault')}`,
      ].join('. ') || 'No advisory available');
    const selectedLanguage = language === 'te' ? 'te' : 'en';
    console.log('Voice advisory text:', advisoryMessage);
    console.log('Language:', selectedLanguage);
    playVoiceAdvisory(advisoryMessage, selectedLanguage);
  };

  return (
    <ScreenContainer>
        {/* Title */}
        <Text style={styles.pageTitle}>⚠ {t('advisoryTitle')}</Text>

        {/* Irrigation */}
        <AdvisorySection
          t={t}
          title={t('irrigation')}
          message={t('irrigationMessage')}
          onDone={handleDone}
          onNotApplicable={handleNotApplicable}
        />

        {/* Fertilizer */}
        <AdvisorySection
          t={t}
          title={t('fertilizer')}
          message={t('fertilizerMessage')}
          onDone={handleDone}
          onNotApplicable={handleNotApplicable}
        />

        {/* Harvest */}
        <AdvisorySection
          t={t}
          title={t('harvest')}
          message={t('harvestMessage')}
          onDone={handleDone}
          onNotApplicable={handleNotApplicable}
        />

        {/* Risk Summary */}
        <AppCard>
          <Text style={styles.summaryTitle}>{t('riskSummary')}</Text>
          <View style={styles.riskRow}>
            <RiskBadge
              riskLevel={(params.riskLevel as 'Low' | 'Medium' | 'High') ?? 'Medium'}
            />
            <Text style={styles.riskScore}>
              {t('riskScoreLabel')}: {params.riskScore ?? '—'}
            </Text>
          </View>
        </AppCard>

        {/* Weather */}
        <AppCard>
          <Text style={styles.summaryTitle}>{t('weather')}</Text>
          <Text style={styles.summaryText}>
            {params.weather ?? t('weatherDefault')}
          </Text>
        </AppCard>

        {/* Market */}
        <AppCard>
          <Text style={styles.summaryTitle}>{t('market')}</Text>
          <Text style={styles.summaryText}>
            {params.market ?? t('marketDefault')}
          </Text>
        </AppCard>

        {/* Crop Health */}
        <AppCard>
          <Text style={styles.summaryTitle}>{t('cropHealth')}</Text>
          <Text style={styles.summaryText}>
            {params.healthStatus
              ? `${t('statusLabel')}: ${params.healthStatus}`
              : t('cropHealthDefault')}
          </Text>
        </AppCard>

        {/* Play Voice Advisory */}
        <Pressable
          style={({ pressed }) => [
            styles.voiceBtn,
            pressed && styles.btnPressed,
          ]}
          onPress={handlePlayVoice}>
          <Text style={styles.voiceBtnText}>{t('playVoiceAdvisory')}</Text>
        </Pressable>
      </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  doneBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  naBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  naBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  riskScore: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  voiceBtn: {
    backgroundColor: COLORS.healthy,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  voiceBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
