import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from '../../constants/theme';

interface NotificationBannerProps {
  title: string;
  body: string;
  visible: boolean;
  onPress?: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function NotificationBanner({
  title,
  body,
  visible,
  onPress,
  onDismiss,
  autoDismissMs = 4000,
}: NotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss
      translateY.value = withDelay(autoDismissMs, withTiming(-120, { duration: 300 }));
      opacity.value = withDelay(
        autoDismissMs,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        })
      );
    } else {
      translateY.value = withTiming(-120);
      opacity.value = withTiming(0);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top + SPACING.sm },
        SHADOW.lg,
        animStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={() => {
          onPress?.();
          onDismiss();
        }}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 9999,
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.lg,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 2,
  },
  body: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FONT_SIZE.sm,
  },
  dismiss: {
    padding: SPACING.xs,
  },
  dismissText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.base,
  },
});
