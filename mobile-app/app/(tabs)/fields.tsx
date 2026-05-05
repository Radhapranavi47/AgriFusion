import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppCard } from '@/components/cards/AppCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/api';

interface Farm {
  _id: string;
  farmerName: string;
  cropType: string;
  sowingDate: string;
  location: { type: string; coordinates: number[][][] };
}

function computeArea(coords: number[][][] | undefined): string {
  if (!coords?.[0]?.length) return '—';
  try {
    const ring = coords[0];
    if (ring.length < 3) return '—';
    let sum = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      sum += xi * yj - xj * yi;
    }
    const sqDeg = Math.abs(sum) / 2;
    const avgLat = ring.reduce((s, p) => s + p[1], 0) / n;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos((avgLat * Math.PI) / 180);
    const sqM = sqDeg * mPerDegLat * mPerDegLng;
    const ha = sqM / 10000;
    return ha >= 0.01 ? `${ha.toFixed(1)} ha` : `${Math.round(sqM)} m²`;
  } catch {
    return '—';
  }
}

export default function FieldsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFarms = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFarms(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Error fetching farms:', err);
      Alert.alert(t('error'), t('failedToLoadFields'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFarms();
  };

  const handleAddField = () => {
    router.push('/field/add-field');
  };

  const handleFieldPress = (farmId: string) => {
    router.push(`/field/${farmId}`);
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('fields')}</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loadingFields')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }>
      <View style={styles.header}>
        <Text style={styles.title}>{t('fields')}</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
          onPress={handleAddField}>
          <Text style={styles.addBtnText}>{t('addField')}</Text>
        </Pressable>
      </View>

      {farms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('noFieldsYet')}</Text>
          <Text style={styles.emptySubtext}>
            {t('tapAddField')}
          </Text>
        </View>
      ) : (
        farms.map((farm) => (
          <Pressable
            key={farm._id}
            onPress={() => handleFieldPress(farm._id)}
            style={({ pressed }) => [
              styles.cardPressable,
              pressed && styles.btnPressed,
            ]}>
            <AppCard style={styles.fieldCard}>
              <Text style={styles.fieldName}>
                {farm.farmerName}{t('farmLabel')}
              </Text>
              <Text style={styles.fieldCrop}>{farm.cropType}</Text>
              <Text style={styles.fieldArea}>
                {computeArea(farm.location?.coordinates)}
              </Text>
            </AppCard>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.85,
  },
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
  empty: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardPressable: {
    marginBottom: 0,
  },
  fieldCard: {
    marginBottom: SPACING.md,
  },
  fieldName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  fieldCrop: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  fieldArea: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
