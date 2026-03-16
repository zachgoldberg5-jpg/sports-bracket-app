/**
 * Unified sports data abstraction layer.
 * Routes requests to ESPN or TheSportsDB depending on the league,
 * with AsyncStorage caching to minimise API calls.
 */

import type { Bracket, ConferenceStandings, LeagueId, LeagueStatus } from '../types';
import { ESPN_LEAGUE_PATHS, getDisplaySeason } from '../constants/leagues';
import { fetchEspnStandings, fetchEspnBracket } from './espnApi';
import { fetchSportsDbStandings, fetchSportsDbEvents } from './theSportsDb';
import { withCache, TTL } from './cache';

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
    TTL.STANDINGS
  );
}

// ─── WBC 2026 bracket ─────────────────────────────────────────────────────────

function wbcTeam(id: string, name: string, abbr: string): import('../types').Team {
  return { id: `wbc_${id}`, name, abbreviation: abbr };
}

function getWbc2026Bracket(): Bracket {
  const japan   = wbcTeam('japan',   'Japan',              'JPN');
  const cuba    = wbcTeam('cuba',    'Cuba',               'CUB');
  const mexico  = wbcTeam('mexico',  'Mexico',             'MEX');
  const italy   = wbcTeam('italy',   'Italy',              'ITA');
  const usa     = wbcTeam('usa',     'United States',      'USA');
  const korea   = wbcTeam('korea',   'Korea',              'KOR');
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
            homeTeam: japan, awayTeam: cuba,
            homeScore: 5, awayScore: 0,
            winnerId: japan.id, status: 'final',
            startTime: '2026-03-12T18:00:00Z',
          },
          {
            id: 'wbc26_qf2', round: 1, position: 1,
            homeTeam: mexico, awayTeam: italy,
            homeScore: 3, awayScore: 1,
            winnerId: mexico.id, status: 'final',
            startTime: '2026-03-13T18:00:00Z',
          },
          {
            id: 'wbc26_qf3', round: 1, position: 2,
            homeTeam: usa, awayTeam: korea,
            homeScore: 6, awayScore: 2,
            winnerId: usa.id, status: 'final',
            startTime: '2026-03-12T21:00:00Z',
          },
          {
            id: 'wbc26_qf4', round: 1, position: 3,
            homeTeam: dr, awayTeam: ven,
            homeScore: 4, awayScore: 3,
            winnerId: dr.id, status: 'final',
            startTime: '2026-03-13T21:00:00Z',
          },
        ],
      },
      {
        roundNumber: 2,
        label: 'Semifinals',
        matches: [
          {
            id: 'wbc26_sf1', round: 2, position: 0,
            homeTeam: japan, awayTeam: mexico,
            winnerId: undefined, status: 'scheduled',
            startTime: '2026-03-18T20:00:00Z',
          },
          {
            id: 'wbc26_sf2', round: 2, position: 1,
            homeTeam: usa, awayTeam: dr,
            winnerId: undefined, status: 'scheduled',
            startTime: '2026-03-19T20:00:00Z',
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
