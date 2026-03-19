import React, { useState } from 'react';
import { Image, Text } from 'react-native';
import { LEAGUE_LOGOS, LEAGUE_EMOJI } from '../../constants/leagues';
import type { LeagueId } from '../../types';

// Logos that are wider than they are tall — maps leagueId to aspect ratio (width/height)
const LOGO_ASPECT: Partial<Record<LeagueId, number>> = {
  ncaa_mm: 2.34,
};

interface LeagueLogoProps {
  leagueId: LeagueId | string;
  size?: number;
}

export function LeagueLogo({ leagueId, size = 32 }: LeagueLogoProps) {
  const [failed, setFailed] = useState(false);
  const logoUrl = LEAGUE_LOGOS[leagueId as LeagueId] ?? null;
  const emoji = LEAGUE_EMOJI[leagueId as LeagueId] ?? '🏆';
  const aspect = LOGO_ASPECT[leagueId as LeagueId] ?? 1;
  const imgWidth = Math.round(size * aspect);

  if (logoUrl && !failed) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: imgWidth, height: size }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.75 }}>{emoji}</Text>;
}
