import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_WEIGHT } from '../../constants/theme';
import { useColorScheme } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 40, style }: AvatarProps) {
  const scheme = useColorScheme();
  const [error, setError] = useState(false);

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2)
    : '?';

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Emoji sticker avatar (legacy support)
  if (uri?.startsWith('emoji://')) {
    const emoji = uri.replace('emoji://', '');
    return (
      <View style={[styles.fallback, circleStyle, { backgroundColor: COLORS.primary + '22' }, style]}>
        <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }}>{emoji}</Text>
      </View>
    );
  }

  // Image avatar (DiceBear cartoon or uploaded)
  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={[circleStyle, style as object]}
        resizeMode="cover"
        onError={() => setError(true)}
      />
    );
  }

  // Initials fallback
  return (
    <View style={[styles.fallback, circleStyle, { backgroundColor: COLORS.primary }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: FONT_WEIGHT.bold },
});
