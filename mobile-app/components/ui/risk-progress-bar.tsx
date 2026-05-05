import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type RiskLevel = 'Low' | 'Medium' | 'High';

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#4CAF50',
  Medium: '#FF9800',
  High: '#F44336',
};

const ANIMATION_DURATION = 400;

interface RiskProgressBarProps {
  score: number;
  riskLevel: RiskLevel;
}

export function RiskProgressBar({ score, riskLevel }: RiskProgressBarProps) {
  const progress = useSharedValue(0);
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const fillColor = RISK_COLORS[riskLevel] ?? '#757575';

  useEffect(() => {
    progress.value = withTiming(clampedScore / 100, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedScore]);

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: fillColor },
            animatedFillStyle,
          ]}
        />
      </View>
      <Text style={[styles.percentageText, { color: fillColor }]}>
        {clampedScore}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
});
