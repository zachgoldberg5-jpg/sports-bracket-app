/**
 * Unified sports data abstraction layer.
 * Routes requests to ESPN or TheSportsDB depending on the league,
 * with AsyncStorage caching to minimise API calls.
 */

import type { Bracket, BracketRound, Match, Team, ConferenceStandings, LeagueId, LeagueStatus } from '../types';
import { ESPN_LEAGUE_PATHS, getDisplaySeason } from '../constants/leagues';
import { fetchEspnStandings, fetchEspnBracket } from './espnApi';
import { fetchSportsDbStandings, fetchSportsDbEvents } from './theSportsDb';
import { withCache, TTL } from './cache';
import { supabase, supabaseConfigured } from './supabase';

// ─── Routing helpers ──────────────────────────────────────────────────────────

function hasEspn(leagueId: LeagueId): boolean {
  return ESPN_LEAGUE_PATHS[leagueId] !== null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStandings(leagueId: LeagueId): Promise<ConferenceStandings[]> {
  return withCache(
    `standings_${leagueId}`,
    async () => {
      if (hasEspn(leagueId)) {
        return fetchEspnStandings(leagueId);
      }
      return fetchSportsDbStandings(leagueId);
    },
    TTL.STANDINGS
  );
}

export async function getBracket(leagueId: LeagueId, season?: string): Promise<Bracket> {
  return withCache(
    `bracket_${leagueId}_${season ?? 'current'}`,
    async () => {
      if (leagueId === 'wbc') {
        return getWbc2026Bracket();
      }
      if (leagueId === 'ncaa_mm') {
        return getNcaaMm2026Bracket();
      }
      if (supabaseConfigured) {
        const sb = await fetchSupabaseBracket(leagueId);
        if (sb) return sb;
      }
      if (hasEspn(leagueId)) {
        return fetchEspnBracket(leagueId, season);
      }
      // For leagues without ESPN support, build a bracket stub from TheSportsDB events
      const events = await fetchSportsDbEvents(leagueId);
      return buildBracketFromEvents(leagueId, events);
    },
    TTL.LIVE
  );
}

export async function getLeagueStatus(leagueId: LeagueId): Promise<LeagueStatus> {
  return withCache(
    `status_${leagueId}`,
    async () => {
      // Check Supabase leagues table first for explicit status overrides
      if (supabaseConfigured) {
        try {
          const { data } = await supabase
            .from('leagues')
            .select('status')
            .eq('id', leagueId)
            .single();
          if (data?.status) return data.status as LeagueStatus;
        } catch {
          // fall through to bracket-derived status
        }
      }
      try {
        const bracket = await getBracket(leagueId);
        if (bracket.champion) return 'completed';
        const hasLiveMatches = bracket.rounds
          .flatMap((r) => r.matches)
          .some((m) => m.status === 'live');
        const hasScheduledMatches = bracket.rounds
          .flatMap((r) => r.matches)
          .some((m) => m.status === 'scheduled');
        if (hasLiveMatches || hasScheduledMatches) return 'live';
        return 'upcoming';
      } catch {
        return 'off_season';
      }
    },
    TTL.LIVE
  );
}

// ─── Supabase bracket fetcher ─────────────────────────────────────────────────

async function fetchSupabaseBracket(leagueId: LeagueId): Promise<Bracket | null> {
  try {
    const { data, error } = await supabase
      .from('brackets')
      .select('id, league_id, season, rounds, champion_id, is_official, updated_at')
      .eq('league_id', leagueId)
      .eq('is_official', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const rounds = (data.rounds as BracketRound[]) ?? [];
    if (!rounds.length) return null;

    return {
      id: data.id,
      leagueId: data.league_id as LeagueId,
      season: data.season,
      rounds,
      isOfficial: data.is_official,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

// ─── WBC 2026 bracket ─────────────────────────────────────────────────────────

const WBC_FLAGS: Record<string, string> = {
  japan:  'jp', mexico: 'mx', canada: 'ca', pr:    'pr',
  italy:  'it', usa:   'us', dr:     'do', ven:   've',
};

function wbcTeam(id: string, name: string, abbr: string): import('../types').Team {
  const flag = WBC_FLAGS[id];
  return {
    id: `wbc_${id}`,
    name,
    abbreviation: abbr,
    logoUrl: flag ? `https://flagcdn.com/w80/${flag}.png` : undefined,
  };
}

function getWbc2026Bracket(): Bracket {
  const japan   = wbcTeam('japan',   'Japan',              'JPN');
  const mexico  = wbcTeam('mexico',  'Mexico',             'MEX');
  const canada  = wbcTeam('canada',  'Canada',             'CAN');
  const pr      = wbcTeam('pr',      'Puerto Rico',        'PUR');
  const italy   = wbcTeam('italy',   'Italy',              'ITA');
  const usa     = wbcTeam('usa',     'United States',      'USA');
  const dr      = wbcTeam('dr',      'Dominican Republic', 'DOM');
  const ven     = wbcTeam('ven',     'Venezuela',          'VEN');

  return {
    id: 'wbc_2026_bracket',
    leagueId: 'wbc',
    season: '2026',
    isOfficial: true,
    updatedAt: new Date().toISOString(),
    rounds: [
      {
        roundNumber: 1,
        label: 'Quarterfinals',
        matches: [
          {
            id: 'wbc26_qf1', round: 1, position: 0,
            homeTeam: usa, awayTeam: canada,
            homeScore: 5, awayScore: 3,
            winnerId: usa.id, status: 'final',
            startTime: '2026-03-13T18:00:00Z',
          },
          {
            id: 'wbc26_qf2', round: 1, position: 1,
            homeTeam: dr, awayTeam: pr,
            homeScore: 6, awayScore: 2,
            winnerId: dr.id, status: 'final',
            startTime: '2026-03-13T21:00:00Z',
          },
          {
            id: 'wbc26_qf3', round: 1, position: 2,
            homeTeam: ven, awayTeam: japan,
            homeScore: 8, awayScore: 5,
            winnerId: ven.id, status: 'final',
            startTime: '2026-03-14T18:00:00Z',
          },
          {
            id: 'wbc26_qf4', round: 1, position: 3,
            homeTeam: italy, awayTeam: mexico,
            homeScore: 5, awayScore: 3,
            winnerId: italy.id, status: 'final',
            startTime: '2026-03-14T21:00:00Z',
          },
        ],
      },
      {
        roundNumber: 2,
        label: 'Semifinals',
        matches: [
          {
            id: 'wbc26_sf1', round: 2, position: 0,
            homeTeam: usa, awayTeam: dr,
            winnerId: undefined, status: 'scheduled',
            startTime: '2026-03-16T00:00:00Z',
          },
          {
            id: 'wbc26_sf2', round: 2, position: 1,
            homeTeam: ven, awayTeam: italy,
            winnerId: undefined, status: 'scheduled',
            startTime: '2026-03-17T00:00:00Z',
          },
        ],
      },
      {
        roundNumber: 3,
        label: 'Championship',
        matches: [
          {
            id: 'wbc26_final', round: 3, position: 0,
            homeTeam: undefined, awayTeam: undefined,
            winnerId: undefined, status: 'tbd',
            startTime: '2026-03-21T20:00:00Z',
          },
        ],
      },
    ],
  };
}

// ─── NCAA March Madness 2026 bracket ─────────────────────────────────────────

function getNcaaMm2026Bracket(): Bracket {
  const logo = (id: number) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
  const t = (id: string, name: string, abbr: string, seed: number, espnId?: number): Team =>
    ({ id: `ncaa_${id}`, name, abbreviation: abbr, seed, logoUrl: espnId ? logo(espnId) : undefined });

  // ── East ─────────────────────────────────────────────
  const [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12,e13,e14,e15,e16] = [
    t('duke',       'Duke',              'DUKE', 1,  150),
    t('uconn',      'UConn',             'CONN', 2,  41),
    t('mich_st',    'Michigan State',    'MSU',  3,  127),
    t('kansas',     'Kansas',            'KU',   4,  2305),
    t('st_johns',   "St. John's",        'STJ',  5,  2599),
    t('louisville', 'Louisville',        'LOU',  6,  97),
    t('ucla',       'UCLA',              'UCLA', 7,  26),
    t('ohio_st',    'Ohio State',        'OSU',  8,  194),
    t('tcu',        'TCU',               'TCU',  9,  2628),
    t('ucf',        'UCF',               'UCF',  10, 2116),
    t('usf',        'South Florida',     'USF',  11, 58),
    t('uni',        'Northern Iowa',     'UNI',  12, 2460),
    t('cbu',        'Cal Baptist',       'CBU',  13, 2856),
    t('ndsu',       'North Dakota St.',  'NDSU', 14, 2449),
    t('furman',     'Furman',            'FUR',  15, 231),
    t('siena',      'Siena',             'SIEN', 16, 2561),
  ];

  // ── West ─────────────────────────────────────────────
  const [w1,w2,w3,w4,w5,w6,w7,w8,w9,w10,w11,w12,w13,w14,w15,w16] = [
    t('arizona',    'Arizona',           'ARIZ', 1,  12),
    t('purdue',     'Purdue',            'PUR',  2,  2509),
    t('gonzaga',    'Gonzaga',           'GONZ', 3,  2250),
    t('arkansas',   'Arkansas',          'ARK',  4,  8),
    t('wisconsin',  'Wisconsin',         'WIS',  5,  275),
    t('byu',        'BYU',               'BYU',  6,  252),
    t('miami_fl',   'Miami (FL)',        'MIA',  7,  2390),
    t('villanova',  'Villanova',         'NOVA', 8,  222),
    t('utah_st',    'Utah State',        'USU',  9,  328),
    t('missouri',   'Missouri',          'MIZZ', 10, 142),
    t('ff_w11',     'TEX/NCSU',          'FF11', 11),
    t('high_point', 'High Point',        'HPU',  12, 2272),
    t('hawaii',     "Hawai'i",           'HAW',  13, 62),
    t('kennesaw',   'Kennesaw St.',      'KENN', 14, 338),
    t('queens',     'Queens',            'QUNS', 15),
    t('liu',        'LIU',               'LIU',  16, 112358),
  ];

  // ── South ────────────────────────────────────────────
  const [so1,so2,so3,so4,so5,so6,so7,so8,so9,so10,so11,so12,so13,so14,so15,so16] = [
    t('florida',    'Florida',           'FLA',  1,  57),
    t('houston',    'Houston',           'HOU',  2,  248),
    t('illinois',   'Illinois',          'ILL',  3,  356),
    t('nebraska',   'Nebraska',          'NEB',  4,  158),
    t('vanderbilt', 'Vanderbilt',        'VAN',  5,  238),
    t('unc',        'North Carolina',    'UNC',  6,  153),
    t('saint_marys',"Saint Mary's",      'SMC',  7,  2608),
    t('clemson',    'Clemson',           'CLEM', 8,  228),
    t('iowa',       'Iowa',              'IOWA', 9,  2294),
    t('texas_am',   'Texas A&M',         'TAMU', 10, 245),
    t('vcu',        'VCU',               'VCU',  11, 2670),
    t('mcneese',    'McNeese',           'MCNS', 12, 2377),
    t('troy',       'Troy',              'TROY', 13, 2653),
    t('penn',       'Penn',              'PENN', 14, 219),
    t('idaho',      'Idaho',             'IDA',  15, 70),
    t('ff_so16',    'PV/LEH',            'FF16', 16),
  ];

  // ── Midwest ───────────────────────────────────────────
  const [mw1,mw2,mw3,mw4,mw5,mw6,mw7,mw8,mw9,mw10,mw11,mw12,mw13,mw14,mw15,mw16] = [
    t('michigan',   'Michigan',          'MICH', 1,  130),
    t('iowa_st',    'Iowa State',        'ISU',  2,  66),
    t('virginia',   'Virginia',          'UVA',  3,  258),
    t('alabama',    'Alabama',           'ALA',  4,  333),
    t('texas_tech', 'Texas Tech',        'TTU',  5,  2641),
    t('tennessee',  'Tennessee',         'TENN', 6,  2633),
    t('kentucky',   'Kentucky',          'UK',   7,  96),
    t('georgia',    'Georgia',           'UGA',  8,  61),
    t('saint_louis','Saint Louis',       'SLU',  9,  139),
    t('santa_clara','Santa Clara',       'SCU',  10, 2541),
    t('ff_mw11',    'MIA/SMU',           'FF11', 11),
    t('akron',      'Akron',             'AKRN', 12, 2006),
    t('hofstra',    'Hofstra',           'HOF',  13, 2275),
    t('wright_st',  'Wright State',      'WRST', 14, 2750),
    t('tenn_st',    'Tennessee State',   'TSU',  15, 2634),
    t('ff_mw16',    'UMBC/HOW',          'FF16', 16),
  ];

  const sch = (id: string, r: number, pos: number, home: Team, away: Team, date: string): Match => ({
    id: `ncaa26_${id}`, round: r, position: pos,
    homeTeam: home, awayTeam: away,
    status: 'scheduled', startTime: date,
  });
  const tbdMatch = (id: string, r: number, pos: number): Match => ({
    id: `ncaa26_tbd_${id}`, round: r, position: pos,
    homeTeam: undefined, awayTeam: undefined, status: 'tbd',
  });
  const tbdRound = (roundNum: number, label: string, count: number): BracketRound => ({
    roundNumber: roundNum, label,
    matches: Array.from({ length: count }, (_, i) => tbdMatch(`r${roundNum}_${i}`, roundNum, i)),
  });

  // Round of 64 dates
  const thu = '2026-03-19T00:00:00Z';
  const fri = '2026-03-20T00:00:00Z';

  return {
    id: 'ncaa_mm_2026_bracket',
    leagueId: 'ncaa_mm',
    season: '2025-26',
    isOfficial: true,
    updatedAt: new Date().toISOString(),
    rounds: [
      {
        roundNumber: 1,
        label: 'Round of 64',
        matches: [
          // East top-left (0-7): 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
          sch('e1v16', 1, 0,  e1,  e16, thu),
          sch('e8v9',  1, 1,  e8,  e9,  thu),
          sch('e5v12', 1, 2,  e5,  e12, thu),
          sch('e4v13', 1, 3,  e4,  e13, thu),
          sch('e6v11', 1, 4,  e6,  e11, fri),
          sch('e3v14', 1, 5,  e3,  e14, fri),
          sch('e7v10', 1, 6,  e7,  e10, fri),
          sch('e2v15', 1, 7,  e2,  e15, fri),
          // South bottom-left (8-15)
          sch('so1v16', 1, 8,  so1, so16, thu),
          sch('so8v9',  1, 9,  so8, so9,  thu),
          sch('so5v12', 1, 10, so5, so12, thu),
          sch('so4v13', 1, 11, so4, so13, thu),
          sch('so6v11', 1, 12, so6, so11, fri),
          sch('so3v14', 1, 13, so3, so14, fri),
          sch('so7v10', 1, 14, so7, so10, fri),
          sch('so2v15', 1, 15, so2, so15, fri),
          // West top-right (16-23)
          sch('w1v16', 1, 16, w1,  w16, thu),
          sch('w8v9',  1, 17, w8,  w9,  thu),
          sch('w5v12', 1, 18, w5,  w12, thu),
          sch('w4v13', 1, 19, w4,  w13, thu),
          sch('w6v11', 1, 20, w6,  w11, fri),
          sch('w3v14', 1, 21, w3,  w14, fri),
          sch('w7v10', 1, 22, w7,  w10, fri),
          sch('w2v15', 1, 23, w2,  w15, fri),
          // Midwest bottom-right (24-31)
          sch('mw1v16', 1, 24, mw1, mw16, thu),
          sch('mw8v9',  1, 25, mw8, mw9,  thu),
          sch('mw5v12', 1, 26, mw5, mw12, thu),
          sch('mw4v13', 1, 27, mw4, mw13, thu),
          sch('mw6v11', 1, 28, mw6, mw11, fri),
          sch('mw3v14', 1, 29, mw3, mw14, fri),
          sch('mw7v10', 1, 30, mw7, mw10, fri),
          sch('mw2v15', 1, 31, mw2, mw15, fri),
        ],
      },
      tbdRound(2, 'Round of 32',   16),
      tbdRound(3, 'Sweet 16',       8),
      tbdRound(4, 'Elite Eight',    4),
      tbdRound(5, 'Final Four',     2),
      tbdRound(6, 'Championship',   1),
    ],
  };
}

// ─── Mock bracket for unsupported leagues ────────────────────────────────────

function buildBracketFromEvents(
  leagueId: LeagueId,
  _events: Array<Record<string, unknown>>
): Bracket {
  // Returns a minimal bracket structure when no API support exists
  return {
    id: `stub_${leagueId}`,
    leagueId,
    season: getDisplaySeason(leagueId),
    rounds: [],
    isOfficial: false,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Mock data (used when API is unavailable / for development) ───────────────

export function getMockLeagueData(leagueId: LeagueId): Bracket {
  const teams = generateMockTeams(leagueId, 8);
  const rounds = buildMockBracket(teams);
  return {
    id: `mock_${leagueId}`,
    leagueId,
    season: getDisplaySeason(leagueId),
    rounds,
    isOfficial: false,
    updatedAt: new Date().toISOString(),
  };
}

function generateMockTeams(leagueId: LeagueId, count: number) {
  const names: Record<LeagueId, string[]> = {
    nba: ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Nuggets', 'Bucks', 'Suns', 'Nets'],
    nfl: ['Chiefs', 'Eagles', 'Cowboys', '49ers', 'Ravens', 'Bills', 'Lions', 'Bengals'],
    nhl: ['Bruins', 'Lightning', 'Avalanche', 'Golden Knights', 'Rangers', 'Oilers', 'Panthers', 'Kings'],
    mlb: ['Yankees', 'Dodgers', 'Braves', 'Astros', 'Red Sox', 'Phillies', 'Padres', 'Mets'],
    mls: ['LAFC', 'Inter Miami', 'Columbus', 'NYCFC', 'Seattle', 'Atlanta', 'Portland', 'Colorado'],
    ncaa_mm: ['Duke', 'Kansas', 'Kentucky', 'North Carolina', 'Gonzaga', 'Houston', 'Texas', 'Alabama'],
    ucl: ['Man City', 'Real Madrid', 'Bayern', 'PSG', 'Barcelona', 'Arsenal', 'Milan', 'Inter'],
    fifa_wc: ['Brazil', 'France', 'Argentina', 'England', 'Germany', 'Spain', 'Portugal', 'Netherlands'],
    wbc: ['Japan', 'United States', 'Dominican Republic', 'Korea', 'Venezuela', 'Puerto Rico', 'Italy', 'Canada'],
  };

  return (names[leagueId] ?? names.nba).slice(0, count).map((name, i) => ({
    id: `${leagueId}_team_${i + 1}`,
    name,
    abbreviation: name.substring(0, 3).toUpperCase(),
    seed: i + 1,
    wins: 50 - i * 3,
    losses: 10 + i * 3,
  }));
}

function buildMockBracket(teams: ReturnType<typeof generateMockTeams>) {
  const r1Matches = [];
  for (let i = 0; i < teams.length / 2; i++) {
    r1Matches.push({
      id: `mock_r1_${i}`,
      round: 1,
      position: i,
      homeTeam: teams[i * 2],
      awayTeam: teams[i * 2 + 1],
      homeScore: undefined,
      awayScore: undefined,
      winnerId: teams[i * 2].id, // mock: home always wins
      status: 'final' as const,
      startTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    });
  }

  const r2Winners = r1Matches.map((m) => teams.find((t) => t.id === m.winnerId)!);
  const r2Matches = [];
  for (let i = 0; i < r2Winners.length / 2; i++) {
    r2Matches.push({
      id: `mock_r2_${i}`,
      round: 2,
      position: i,
      homeTeam: r2Winners[i * 2],
      awayTeam: r2Winners[i * 2 + 1],
      homeScore: undefined,
      awayScore: undefined,
      winnerId: undefined,
      status: 'scheduled' as const,
      startTime: new Date(Date.now() + 86400000).toISOString(),
    });
  }

  return [
    { roundNumber: 1, label: 'First Round', matches: r1Matches },
    { roundNumber: 2, label: 'Semifinals', matches: r2Matches },
    {
      roundNumber: 3,
      label: 'Final',
      matches: [
        {
          id: 'mock_final',
          round: 3,
          position: 0,
          homeTeam: undefined,
          awayTeam: undefined,
          winnerId: undefined,
          status: 'tbd' as const,
        },
      ],
    },
  ];
}
