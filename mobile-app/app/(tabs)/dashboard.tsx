import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants/theme';

import { API_BASE_URL } from '@/constants/api';

interface TodayWeather {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  rainfallToday: number;
}

interface WeeklyDay {
  date: string | null;
  temperature: number | null;
  rainfall: number;
}

interface DashboardData {
  district: string;
  todayWeather: TodayWeather;
  weeklyWeather: WeeklyDay[];
  market: {
    commodity: string;
    averagePrice: number | null;
    trend: string;
  };
}

function getTrendColor(trend: string): string {
  const t = (trend ?? '').toLowerCase();
  if (t.includes('rising')) return COLORS.healthy;
  if (t.includes('falling')) return COLORS.high;
  return COLORS.textSecondary;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('failedToLoadDashboard'));
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [token, fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const name = user?.name ?? t('farmer');
  const district = data?.district ?? user?.district ?? '—';

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loadingDashboard')}</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.retryText}
          onPress={() => {
            setLoading(true);
            fetchDashboard();
          }}>
          {t('tapToRetry')}
        </Text>
      </View>
    );
  }

  const weekly = data?.weeklyWeather ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{t('hello')}, {name}</Text>
            <Text style={styles.district}>{t('district')}: {district}</Text>
          </View>
          <View style={styles.headerActions}>
            <LanguageToggle />
            <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
            onPress={async () => {
              await logout();
              const rootNav = navigation.getParent()?.getParent?.();
              if (typeof rootNav?.reset === 'function') {
                rootNav.reset({
                  index: 0,
                  routes: [{ name: '(auth)', state: { routes: [{ name: 'login' }], index: 0 } }],
                });
              } else {
                router.replace('/(auth)/login');
              }
            }}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </Pressable>
          </View>
        </View>
      </View>

      {/* Card 1: Today's Weather */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('todaysWeather')}</Text>
        <View style={styles.weatherGrid}>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherValue}>
              {data?.todayWeather.temperature ?? '—'}°C
            </Text>
            <Text style={styles.weatherLabel}>{t('temp')}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherValue}>
              {data?.todayWeather.humidity ?? '—'}%
            </Text>
            <Text style={styles.weatherLabel}>{t('humidity')}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherValue}>
              {data?.todayWeather.rainfallToday ?? 0} mm
            </Text>
            <Text style={styles.weatherLabel}>{t('rain')}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherValue}>
              {data?.todayWeather.windSpeed ?? '—'} km/h
            </Text>
            <Text style={styles.weatherLabel}>{t('wind')}</Text>
          </View>
        </View>
      </View>

      {/* Card 2: 7-Day Forecast */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('sevenDayForecast')}</Text>
        {weekly.map((day, i) => (
          <View key={day.date ?? i} style={[styles.forecastRow, i === weekly.length - 1 && styles.forecastRowLast]}>
            <Text style={styles.forecastDate}>
              {day.date ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }) : '—'}
            </Text>
            <Text style={styles.forecastTemp}>{day.temperature ?? '—'}°C</Text>
            <Text style={styles.forecastRain}>{day.rainfall ?? 0} mm</Text>
          </View>
        ))}
      </View>

      {/* Card 3: Paddy Market Price */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('paddyMarketPrice')}</Text>
        <View style={styles.marketRow}>
          <View>
            <Text style={styles.price}>
              {data?.market.averagePrice != null
                ? `₹${data.market.averagePrice} / q`
                : t('marketDataUnavailable')}
            </Text>
            <Text style={[styles.trend, { color: getTrendColor(data?.market.trend ?? '') }]}>
              {data?.market.trend ?? '—'}
            </Text>
          </View>
          <Text style={styles.marketDistrict}>{district}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.high,
    fontWeight: '600',
  },
  retryText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoutBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.7,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  district: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.sm,
  },
  weatherItem: {
    width: '50%',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  weatherValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weatherLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  forecastRowLast: {
    borderBottomWidth: 0,
  },
  forecastDate: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: SPACING.md,
  },
  forecastRain: {
    fontSize: 13,
    color: COLORS.textSecondary,
    minWidth: 48,
    textAlign: 'right',
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trend: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  marketDistrict: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
