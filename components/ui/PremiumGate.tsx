import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

interface PremiumGateProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  feature?: string;
}

export function PremiumGate({
  visible,
  onClose,
  onUpgrade,
  feature = 'unlimited groups',
}: PremiumGateProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Text style={styles.crown}>👑</Text>
          <Text style={[styles.title, { color: theme.text }]}>Go Premium</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock {feature} and more with Sports Bracket Premium.
          </Text>

          <View style={styles.features}>
            {[
              'Unlimited prediction groups',
              'Advanced bracket statistics',
              'Custom group themes',
              'Priority support',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={[styles.featureText, { color: theme.text }]}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgrade ?? onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeText}>Upgrade — $4.99/month</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
              Not now
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING['3xl'],
    alignItems: 'center',
  },
  crown: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  check: {
    color: COLORS.success,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  featureText: {
    fontSize: FONT_SIZE.base,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  upgradeText: {
    color: '#000000',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  cancelButton: {
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONT_SIZE.base,
  },
});
