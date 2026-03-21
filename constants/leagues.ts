import type { League, LeagueId } from '../types';

// ESPN API sport/league path segments
export const ESPN_LEAGUE_PATHS: Record<LeagueId, { sport: string; league: string } | null> = {
  nba: { sport: 'basketball', league: 'nba' },
  nfl: { sport: 'football', league: 'nfl' },
  nhl: { sport: 'hockey', league: 'nhl' },
  mlb: { sport: 'baseball', league: 'mlb' },
  mls: { sport: 'soccer', league: 'usa.1' },
  ncaa_mm: { sport: 'basketball', league: 'mens-college-basketball' },
  ucl: { sport: 'soccer', league: 'uefa.champions' },
  fifa_wc: null, // TheSportsDB only
  wbc: null,     // Manual bracket
};

// TheSportsDB league IDs
export const THESPORTSDB_IDS: Record<LeagueId, string | null> = {
  nba: '4387',
  nfl: '4391',
  nhl: '4380',
  mlb: '4424',
  mls: '4346',
  ncaa_mm: null,
  ucl: '4480',
  fifa_wc: '4429',
  wbc: null,
};

export const LEAGUE_CONFIGS: Record<LeagueId, Omit<League, 'status' | 'season'>> = {
  nba: {
    id: 'nba',
    name: 'NBA',
    sport: 'Basketball',
    primaryColor: '#C9082A',
    secondaryColor: '#17408B',
  },
  nfl: {
    id: 'nfl',
    name: 'NFL',
    sport: 'Football',
    primaryColor: '#013369',
    secondaryColor: '#D50A0A',
  },
  nhl: {
    id: 'nhl',
    name: 'NHL',
    sport: 'Hockey',
    primaryColor: '#0033A0',
    secondaryColor: '#FFFFFF',
  },
  mlb: {
    id: 'mlb',
    name: 'MLB',
    sport: 'Baseball',
    primaryColor: '#002D72',
    secondaryColor: '#D50032',
  },
  mls: {
    id: 'mls',
    name: 'MLS',
    sport: 'Soccer',
    primaryColor: '#005293',
    secondaryColor: '#E82128',
  },
  ncaa_mm: {
    id: 'ncaa_mm',
    name: 'March Madness',
    sport: 'College Basketball',
    primaryColor: '#F47321',   // Official March Madness orange
    secondaryColor: '#003082', // NCAA navy
  },
  ucl: {
    id: 'ucl',
    name: 'Champions League',
    sport: 'Soccer',
    primaryColor: '#1B3A7A',
    secondaryColor: '#FFD700',
  },
  fifa_wc: {
    id: 'fifa_wc',
    name: 'FIFA World Cup',
    sport: 'Soccer',
    primaryColor: '#326295',
    secondaryColor: '#FFD700',
  },
  wbc: {
    id: 'wbc',
    name: 'World Baseball Classic',
    sport: 'Baseball',
    primaryColor: '#002D72',
    secondaryColor: '#D50032',
  },
};

// Tournament/league logo URLs — falls back to emoji on error
export const LEAGUE_LOGOS: Record<LeagueId, string | null> = {
  nba:     'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  nfl:     'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  nhl:     'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  mlb:     'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  mls:     'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  ncaa_mm: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/March_Madness_logo.svg/500px-March_Madness_logo.svg.png',
  ucl:     'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/2.png',
  fifa_wc: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
  wbc:     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/WBC_Symbol.svg/500px-WBC_Symbol.svg.png',
};

// Sport emoji for UI display
export const LEAGUE_EMOJI: Record<LeagueId, string> = {
  nba:      '🏀',
  nfl:      '🏈',
  nhl:      '🏒',
  mlb:      '⚾',
  mls:      '⚽',
  ncaa_mm:  '🏀',
  ucl:      '⚽',
  fifa_wc:  '🌍',
  wbc:      '⚾',
};

export function getDisplaySeason(leagueId: LeagueId): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (['ucl', 'mls'].includes(leagueId)) {
    return month >= 6
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }
  if (['nba', 'nhl'].includes(leagueId)) {
    return month >= 9
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }
  if (leagueId === 'ncaa_mm') {
    return month >= 6
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }
  if (leagueId === 'nfl') {
    return month >= 8 ? String(year) : String(year - 1);
  }
  return String(year);
}

export const LEAGUE_ORDER: LeagueId[] = [
  'ncaa_mm',
  'wbc',
  'nba',
  'nhl',
  'mlb',
  'mls',
  'ucl',
  'fifa_wc',
  'nfl',
];
