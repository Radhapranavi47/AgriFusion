import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';

export type HealthStatus = 'Healthy' | 'Stressed';

const HEALTH_CONFIG: Record<HealthStatus, { color: string; message: string }> = {
  Healthy: {
    color: COLORS.healthy,
    message: 'Crop is in good health',
  },
  Stressed: {
    color: COLORS.high,
    message: 'Crop needs attention',
  },
};

const CIRCLE_SIZE = 72;

interface HealthIndicatorProps {
  healthStatus: HealthStatus;
}

export function HealthIndicator({ healthStatus }: HealthIndicatorProps) {
  const { color, message } = HEALTH_CONFIG[healthStatus];

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: color }]} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  message: {
    marginTop: SPACING.sm,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
