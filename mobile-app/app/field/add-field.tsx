import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

const INITIAL_REGION = {
  latitude: 16.5062,
  longitude: 80.648,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

function computeArea(points: { latitude: number; longitude: number }[]): string {
  if (!points || points.length < 3) return '—';
  try {
    const ring = points.map((p) => [p.longitude, p.latitude]);
    let sum = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      sum += ring[i][0] * ring[j][1];
      sum -= ring[j][0] * ring[i][1];
    }
    const sqDeg = Math.abs(sum) / 2;
    const avgLat = points.reduce((s, p) => s + p.latitude, 0) / n;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos((avgLat * Math.PI) / 180);
    const sqM = sqDeg * mPerDegLat * mPerDegLng;
    const ha = sqM / 10000;
    return ha >= 0.01 ? `${ha.toFixed(1)} ha` : `${Math.round(sqM)} m²`;
  } catch {
    return '—';
  }
}

export default function AddFieldScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [points, setPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [cropType, setCropType] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleMapPress = useCallback((event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
  }, []);

  const areaDisplay = computeArea(points);
  const canSave = points.length >= 3 && fieldName.trim() && cropType.trim() && sowingDate.trim();

  const handleSave = useCallback(async () => {
    if (!canSave) {
      Alert.alert(t('error'), t('addPointsError'));
      return;
    }

    setSaving(true);
    try {
      const coords = points.map((p) => [p.longitude, p.latitude]);
      coords.push(coords[0]);

      const location = {
        type: 'Polygon',
        coordinates: [coords],
      };

      const res = await fetch(`${API_BASE_URL}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          farmerName: fieldName.trim(),
          cropType: cropType.trim(),
          sowingDate: sowingDate.trim(),
          location,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save field');

      Alert.alert(t('success'), t('fieldSavedSuccess'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)/fields') },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert(t('error'), (err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [canSave, points, fieldName, cropType, sowingDate, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <MapView
        style={styles.map}
        mapType="hybrid"
        showsUserLocation
        showsBuildings
        showsPointsOfInterest
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}>
        {points.length >= 3 && (
          <Polygon
            coordinates={points}
            strokeColor={COLORS.primary}
            fillColor="rgba(46, 125, 50, 0.25)"
            strokeWidth={2}
          />
        )}
      </MapView>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          {t('tapMapHint', { count: points.length })}
        </Text>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('fieldName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('fieldNamePlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={fieldName}
            onChangeText={setFieldName}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('cropType')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('cropTypePlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={cropType}
            onChangeText={setCropType}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('area')}</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={areaDisplay}
            editable={false}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.label}>{t('sowingDate')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('sowingDatePlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={sowingDate}
            onChangeText={setSowingDate}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.clearBtn, pressed && styles.btnPressed]}
            onPress={handleClear}>
            <Text style={styles.clearBtnText}>{t('clearPoints')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              (!canSave || saving) && styles.saveBtnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}>
            <Text
              style={[
                styles.saveBtnText,
                (!canSave || saving) && styles.saveBtnTextDisabled,
              ]}>
              {saving ? t('saving') : t('save')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    height: 280,
  },
  form: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  formContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputRow: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputReadOnly: {
    color: COLORS.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveBtnTextDisabled: {
    color: COLORS.textSecondary,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
