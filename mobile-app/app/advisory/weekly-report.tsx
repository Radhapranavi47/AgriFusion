import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import { AppCard } from '@/components/cards/AppCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { API_BASE_URL } from '@/constants/api';
import { COLORS, SPACING } from '@/constants/theme';

interface AdvisoryRecord {
  _id: string;
  ndvi: number;
  savi: number;
  healthStatus: string;
  riskLevel: string;
  riskScore: number;
  advisory: string;
  createdAt: string;
}

interface AdvisoryHistoryResponse {
  farmId: string;
  count: number;
  advisories: AdvisoryRecord[];
}

function formatPeriod(advisories: AdvisoryRecord[]): string {
  if (!advisories.length) return '—';
  const dates = advisories
    .map((a) => new Date(a.createdAt).getTime())
    .filter(Boolean);
  if (!dates.length) return '—';
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  return `${min.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${max.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function AdvisoryWeeklyReportScreen() {
  const params = useLocalSearchParams<{ farmId?: string }>();
  const { token } = useAuth();
  const [data, setData] = useState<AdvisoryHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const farmId = params.farmId;
    if (farmId) {
      fetch(`${API_BASE_URL}/api/farms/${farmId}/advisory-history`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch((err) => {
          console.error(err);
          Alert.alert('Error', 'Failed to load weekly report.');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [params.farmId, token]);

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const advisories = data?.advisories ?? [];
  const totalAdvisories = data?.count ?? advisories.length;
  const ndviAvg =
    advisories.length > 0
      ? advisories.reduce((s, a) => s + a.ndvi, 0) / advisories.length
      : null;
  const period = formatPeriod(advisories);

  return (
    <ScreenContainer>
      <Text style={styles.title}>📈 Weekly Report</Text>

      <AppCard>
        <Text style={styles.cardLabel}>Period</Text>
        <Text style={styles.cardValue}>
          {period !== '—' ? period : 'No data'}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>Total Advisories</Text>
        <Text style={styles.cardValue}>{totalAdvisories}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>NDVI Average</Text>
        <Text style={styles.cardValue}>
          {ndviAvg != null ? ndviAvg.toFixed(4) : '—'}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>Weather Summary</Text>
        <Text style={styles.cardContent}>
          Moderate temperatures with seasonal humidity. Rainfall within expected
          range. Conditions suitable for crop growth.
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>Market Summary</Text>
        <Text style={styles.cardContent}>
          Prices stable in local mandis. Demand consistent. Monitor harvest-time
          trends for optimal selling.
        </Text>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardContent: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});
