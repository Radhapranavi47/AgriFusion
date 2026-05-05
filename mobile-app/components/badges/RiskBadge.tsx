import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/constants/theme';

export type RiskLevel = 'Low' | 'Medium' | 'High';

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: COLORS.healthy,
  Medium: COLORS.medium,
  High: COLORS.high,
};

interface RiskBadgeProps {
  riskLevel: RiskLevel;
}

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const backgroundColor = RISK_COLORS[riskLevel];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{riskLevel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
