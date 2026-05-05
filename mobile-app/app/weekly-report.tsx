import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AppCard } from '@/components/cards/AppCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { COLORS, SPACING } from '@/constants/theme';

interface ReportCardProps {
  title: string;
  content: string;
}

function ReportCard({ title, content }: ReportCardProps) {
  return (
    <AppCard>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardContent}>{content}</Text>
    </AppCard>
  );
}

export default function WeeklyReportScreen() {
  const params = useLocalSearchParams<{
    period?: string;
    advisory?: string;
    healthTrend?: string;
    weather?: string;
    market?: string;
  }>();

  return (
    <ScreenContainer>
      <Text style={styles.pageTitle}>📈 Weekly Report</Text>

      <ReportCard
        title="Period"
        content={params.period ?? '18–24 Feb 2025'}
      />

      <ReportCard
        title="Advisory Summary"
        content={
          params.advisory ??
          'Crop conditions remained stable. Irrigation and fertilizer schedules followed. No significant pest or disease issues observed.'
        }
      />

      <ReportCard
        title="Health Trend"
        content={
          params.healthTrend ??
          'NDVI improved from 0.62 to 0.68. Vegetation indices indicate healthy growth across the farm.'
        }
      />

      <ReportCard
        title="Weather Summary"
        content={
          params.weather ??
          'Moderate temperatures (28–34°C). Light rainfall mid-week. Humidity levels optimal for crop development.'
        }
      />

      <ReportCard
        title="Market Summary"
        content={
          params.market ??
          'Market data unavailable. Monitor local mandi prices for current rates.'
        }
      />
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
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  cardContent: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});
