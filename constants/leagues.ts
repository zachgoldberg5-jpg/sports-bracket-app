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
  wbc: null, // Manual bracket
};

// TheSportsDB league IDs
export const THESPORTSDB_IDS: Record<LeagueId, string | null> = {
  nba: '4387',
  nfl: '4391',
  nhl: '4380',
  mlb: '4424',
  mls: '4346',
  ncaa_mm: null, // ESPN only
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
    primaryColor: '#003087',
    secondaryColor: '#FFD700',
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

// Returns a human-readable season label for the current season, e.g. "2025-26" or "2025"
export function getDisplaySeason(leagueId: LeagueId): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = Jan)

  // Soccer: season runs July–June (UCL, MLS)
  if (['ucl', 'mls'].includes(leagueId)) {
    return month >= 6
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }

  // NBA / NHL: season runs October–June
  if (['nba', 'nhl'].includes(leagueId)) {
    return month >= 9
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }

  // NCAA March Madness: academic year, starts ~October
  if (leagueId === 'ncaa_mm') {
    return month >= 6
      ? `${year}-${String(year + 1).slice(2)}`
      : `${year - 1}-${String(year).slice(2)}`;
  }

  // NFL: named by the year the season kicks off (Sept–Feb)
  if (leagueId === 'nfl') {
    return month >= 8 ? String(year) : String(year - 1);
  }

  // MLB, FIFA WC, WBC: single calendar year
  return String(year);
}

// Display order on the dashboard
export const LEAGUE_ORDER: LeagueId[] = [
  'wbc',
  'nba',
  'nfl',
  'nhl',
  'mlb',
  'ncaa_mm',
  'mls',
  'ucl',
  'fifa_wc',
];
