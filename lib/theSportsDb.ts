/**
 * TheSportsDB API
 * Free tier key: "3" (rate limited)
 * Docs: https://www.thesportsdb.com/api.php
 */

import type { StandingsEntry, ConferenceStandings, Team, LeagueId } from '../types';
import { THESPORTSDB_IDS } from '../constants/leagues';

const API_KEY = process.env.EXPO_PUBLIC_THESPORTSDB_API_KEY ?? '3';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function mapSportsDbTeam(t: Record<string, unknown>): Team {
  return {
    id: String(t.idTeam),
    name: String(t.strTeam),
    abbreviation: String(t.strTeamShort ?? t.strTeam).substring(0, 3).toUpperCase(),
    logoUrl: t.strTeamBadge as string | undefined,
  };
}

export async function fetchSportsDbStandings(leagueId: LeagueId): Promise<ConferenceStandings[]> {
  const leagueDbId = THESPORTSDB_IDS[leagueId];
  if (!leagueDbId) throw new Error(`No TheSportsDB ID for ${leagueId}`);

  const url = `${BASE}/lookuptable.php?l=${leagueDbId}&s=${getCurrentSeason(leagueId)}`;
  const data = await fetchJson<{ table: Array<Record<string, unknown>> | null }>(url);

  if (!data.table) return [];

  const entries: StandingsEntry[] = data.table.map((row, idx) => ({
    team: {
      id: String(row.idTeam),
      name: String(row.strTeam),
      abbreviation: String(row.strTeam).substring(0, 3).toUpperCase(),
      logoUrl: row.strTeamBadge as string | undefined,
    },
    rank: idx + 1,
    wins: Number(row.intWin ?? 0),
    losses: Number(row.intLoss ?? 0),
    ties: Number(row.intDraw ?? 0),
    points: Number(row.intPoints ?? 0),
    winPct: undefined,
  }));

  return [{ conference: 'League', entries }];
}

export async function fetchSportsDbTeamInfo(teamId: string): Promise<Team | null> {
  const url = `${BASE}/lookupteam.php?id=${teamId}`;
  const data = await fetchJson<{ teams: Array<Record<string, unknown>> | null }>(url);
  const team = data.teams?.[0];
  if (!team) return null;
  return mapSportsDbTeam(team);
}

export async function fetchSportsDbEvents(leagueId: LeagueId): Promise<Array<Record<string, unknown>>> {
  const leagueDbId = THESPORTSDB_IDS[leagueId];
  if (!leagueDbId) throw new Error(`No TheSportsDB ID for ${leagueId}`);
  const url = `${BASE}/eventsseason.php?id=${leagueDbId}&s=${getCurrentSeason(leagueId)}`;
  const data = await fetchJson<{ events: Array<Record<string, unknown>> | null }>(url);
  return data.events ?? [];
}

function getCurrentSeason(leagueId: LeagueId): string {
  const now = new Date();
  const year = now.getFullYear();
  // Soccer seasons cross years
  if (['ucl', 'mls', 'fifa_wc'].includes(leagueId)) {
    return now.getMonth() >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  // US sports: NBA/NHL cross calendar year
  if (['nba', 'nhl'].includes(leagueId)) {
    return now.getMonth() >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  return String(year);
}
