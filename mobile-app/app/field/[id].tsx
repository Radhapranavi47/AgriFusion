import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { AppCard } from '@/components/cards/AppCard';
import { HealthIndicator } from '@/components/cards/HealthIndicator';
import { RiskBadge } from '@/components/badges/RiskBadge';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { playVoiceAdvisory, stopAdvisorySpeech } from '@/utils/speech';
import { API_BASE_URL } from '@/constants/api';

interface Weather {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  heavyRainExpected: boolean;
}

interface AdvisoryData {
  farmId: string;
  cropType: string;
  ndvi: number;
  savi: number;
  weather: Weather;
  market?: {
    commodity: string;
    averagePrice: number | null;
    trend: string;
  };
  healthStatus: string;
  advisory: string;
  riskLevel: string;
  riskScore: number;
}

function getWeatherConditionKey(w: Weather): string {
  if (w.heavyRainExpected) return 'rainExpected';
  if ((w.rainfall ?? 0) > 0) return 'rainy';
  return 'clear';
}

function getTrendIcon(trend: string) {
  const lower = trend?.toLowerCase() ?? '';
  if (lower.includes('rising')) return { name: 'trending-up' as const, color: COLORS.healthy };
  if (lower.includes('falling')) return { name: 'trending-down' as const, color: COLORS.high };
  return { name: 'trending-flat' as const, color: COLORS.textSecondary };
}

export default function FieldDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();
  const { language } = useLanguage();

  const [data, setData] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickCheckModal, setShowQuickCheckModal] = useState(true);
  const [pestObserved, setPestObserved] = useState(false);
  const [leafYellowing, setLeafYellowing] = useState(false);
  const [irrigationRecent, setIrrigationRecent] = useState(false);
  const [submittingQuickCheck, setSubmittingQuickCheck] = useState(false);

  const fetchAdvisory = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${id}/advisory`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.requireFieldCheck === true) {
        setShowQuickCheckModal(true);
        setData(null);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error('Advisory fetch error:', err);
      Alert.alert(t('error'), t('failedToLoadFieldDetailsRetry'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickCheckSubmit = async () => {
    if (!id || !token) return;
    setSubmittingQuickCheck(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/${id}/quick-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pestObserved,
          leafYellowing,
          irrigationRecent,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      setShowQuickCheckModal(false);
      await fetchAdvisory();
    } catch (err) {
      console.error('Quick check submit error:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : t('failedToSubmit'),
      );
    } finally {
      setSubmittingQuickCheck(false);
    }
  };

  const handleSkipQuickCheck = () => {
    setShowQuickCheckModal(false);
    fetchAdvisory();
  };

  // Advisory is fetched only after Quick Field Check modal submit/skip

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdvisory();
  };

  const handleWeeklyReport = () => {
    router.push({
      pathname: '/advisory/weekly-report',
      params: { farmId: id },
    });
  };


  if (!id) {
    return <Redirect href="/(tabs)/fields" />;
  }

  if (showQuickCheckModal) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.fieldCheckPrompt}>
          <Text style={styles.fieldCheckTitle}>{t('quickFieldCheck')}</Text>
          <Text style={styles.fieldCheckSubtitle}>
            {t('personalizeAdvisory')}
          </Text>
        </View>
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('quickFieldCheck')}</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t('pestObserved')}</Text>
                <Switch
                  value={pestObserved}
                  onValueChange={setPestObserved}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t('leafYellowing')}</Text>
                <Switch
                  value={leafYellowing}
                  onValueChange={setLeafYellowing}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t('irrigationRecent')}</Text>
                <Switch
                  value={irrigationRecent}
                  onValueChange={setIrrigationRecent}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
                  onPress={handleSkipQuickCheck}>
                  <Text style={styles.skipBtnText}>{t('skip')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.submitObservationBtn,
                    pressed && styles.btnPressed,
                    submittingQuickCheck && styles.btnDisabled,
                  ]}
                  onPress={handleQuickCheckSubmit}
                  disabled={submittingQuickCheck}>
                  <Text style={styles.submitObservationText}>
                    {submittingQuickCheck ? t('submitting') : t('submit')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loadingFieldDetails')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.loading}>
          <Text style={styles.errorText}>{t('failedToLoadFieldDetails')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const weatherConditionKey = getWeatherConditionKey(data.weather);
  const trendIcon = getTrendIcon(data.market?.trend ?? '');

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }>
      <AppCard>
        <Text style={styles.cardLabel}>{t('healthStatus')}</Text>
        <HealthIndicator
          healthStatus={data.healthStatus as 'Healthy' | 'Stressed'}
        />
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>{t('riskLevel')}</Text>
        <View style={styles.riskRow}>
          <RiskBadge riskLevel={data.riskLevel as 'Low' | 'Medium' | 'High'} />
          <Text style={styles.riskScore}>{t('score')}: {data.riskScore}</Text>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>{t('ndvi')}</Text>
        <Text style={styles.value}>{data.ndvi.toFixed(4)}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>{t('weather')}</Text>
        <View style={styles.weatherRow}>
          <MaterialIcons
            name={weatherConditionKey === 'clear' ? 'wb-sunny' : 'cloud'}
            size={24}
            color={COLORS.primary}
          />
          <View>
            <Text style={styles.temp}>{data.weather.temperature}°C</Text>
            <Text style={styles.subtext}>
              {t(weatherConditionKey)} · {t('humidity')} {data.weather.humidity}%
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>{t('market')}</Text>
        <View style={styles.marketRow}>
          <Text style={styles.price}>
            {data.market?.commodity ?? data.cropType} ·{' '}
            {data.market?.averagePrice != null
              ? `₹${data.market.averagePrice}/quintal`
              : t('marketDataUnavailablePerQuintal')}
          </Text>
          <View style={styles.trendRow}>
            <MaterialIcons name={trendIcon.name} size={18} color={trendIcon.color} />
            <Text style={[styles.trendText, { color: trendIcon.color }]}>
              {data.market?.trend ?? '—'}
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>{t('advisory')}</Text>
        <Text style={styles.advisoryText}>{data.advisory}</Text>
      </AppCard>

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handleWeeklyReport}>
          <Text style={styles.primaryBtnText}>{t('viewWeeklyReport')}</Text>
        </Pressable>

        <View style={styles.voiceRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => {
              // Advisory from already-loaded state (no API request)
              const advisoryMessage = data.advisory || t('advisory') || 'No advisory available';
              const healthVal = t(data.healthStatus.toLowerCase()) || data.healthStatus;
              const riskVal = t(data.riskLevel.toLowerCase()) || data.riskLevel;
              const voiceText = `${t('voiceHealth')} ${healthVal}. ${t('voiceRisk')} ${riskVal}. ${t('voiceAdvisory')}: ${advisoryMessage}.`;
              const selectedLanguage = language === 'te' ? 'te' : 'en';
              console.log('Voice advisory text:', voiceText);
              console.log('Language:', selectedLanguage);
              playVoiceAdvisory(voiceText, selectedLanguage);
            }}>
            <Text style={styles.secondaryBtnText}>{t('playVoiceAdvisory')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.stopBtn, pressed && styles.btnPressed]}
            onPress={stopAdvisorySpeech}>
            <MaterialIcons name="stop" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
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
  errorText: {
    fontSize: 16,
    color: COLORS.high,
    fontWeight: '600',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  temp: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  advisoryText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  buttons: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.healthy,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: COLORS.high,
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
  fieldCheckPrompt: {
    padding: SPACING.lg,
  },
  fieldCheckTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fieldCheckSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitObservationBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  submitObservationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
