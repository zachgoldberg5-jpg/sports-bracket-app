/**
 * ESPN Public API (unofficial but widely used)
 * No API key required for basic endpoints.
 * Base: https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/
 */

import type {
  Bracket,
  BracketRound,
  Match,
  MatchStatus,
  StandingsEntry,
  ConferenceStandings,
  Team,
  LeagueId,
} from '../types';
import { ESPN_LEAGUE_PATHS, getDisplaySeason } from '../constants/leagues';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

function espnUrl(leagueId: LeagueId, endpoint: string): string | null {
  const paths = ESPN_LEAGUE_PATHS[leagueId];
  if (!paths) return null;
  return `${BASE}/${paths.sport}/${paths.league}/${endpoint}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`ESPN API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

function mapEspnTeam(t: Record<string, unknown>): Team {
  const logos = (t.logos as Array<{ href: string }> | undefined) ?? [];
  return {
    id: String(t.id),
    name: String(t.displayName ?? t.name),
    abbreviation: String(t.abbreviation ?? ''),
    logoUrl: logos[0]?.href,
  };
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function fetchEspnStandings(leagueId: LeagueId): Promise<ConferenceStandings[]> {
  const url = espnUrl(leagueId, 'standings');
  if (!url) throw new Error(`No ESPN path for ${leagueId}`);

  const data = await fetchJson<Record<string, unknown>>(url);
  const children = (data.children as Array<Record<string, unknown>>) ?? [];

  return children.map((conference) => {
    const entries = (conference.standings as Record<string, unknown>)?.entries as Array<
      Record<string, unknown>
    > ?? [];

    const mapped: StandingsEntry[] = entries.map((entry, idx) => {
      const team = mapEspnTeam(entry.team as Record<string, unknown>);
      const stats = (entry.stats as Array<Record<string, unknown>>) ?? [];

      const getStat = (name: string) => {
        const s = stats.find((x) => x.name === name || x.abbreviation === name);
        return s ? Number(s.value) : undefined;
      };

      return {
        team,
        rank: idx + 1,
        wins: getStat('wins') ?? getStat('W') ?? 0,
        losses: getStat('losses') ?? getStat('L') ?? 0,
        ties: getStat('ties') ?? getStat('T'),
        points: getStat('points') ?? getStat('PTS'),
        winPct: getStat('winPercent') ?? getStat('PCT'),
        gamesBack: getStat('gamesBehind') ?? getStat('GB'),
        streak: undefined,
      };
    });

    return {
      conference: String(conference.name ?? 'League'),
      entries: mapped,
    };
  });
}

// ─── Bracket / Playoff Bracket ────────────────────────────────────────────────

function mapCompetitor(comp: Record<string, unknown>): Team | undefined {
  const team = comp.team as Record<string, unknown> | undefined;
  if (!team) return undefined;
  return {
    id: String(team.id),
    name: String(team.displayName ?? team.name),
    abbreviation: String(team.abbreviation ?? ''),
    logoUrl: (team.logos as Array<{ href: string }>)?.[0]?.href,
    seed: comp.curatedRank
      ? Number((comp.curatedRank as Record<string, unknown>).current)
      : undefined,
  };
}

function mapEventStatus(status: Record<string, unknown>): MatchStatus {
  const type = (status.type as Record<string, unknown>)?.state ?? '';
  if (type === 'in' || type === 'in_game') return 'live';
  if (type === 'post') return 'final';
  if (type === 'pre') return 'scheduled';
  return 'tbd';
}

function buildMatchFromEvent(
  event: Record<string, unknown>,
  idx: number,
  roundNum: number,
  positionInRound: number
): Match {
  const competitions = (event.competitions as Array<Record<string, unknown>>) ?? [];
  const comp = competitions[0] ?? {};
  const competitors = (comp.competitors as Array<Record<string, unknown>>) ?? [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');
  const status = comp.status as Record<string, unknown>;
  const matchStatus = mapEventStatus(status ?? {});
  let winnerId: string | undefined;
  if (matchStatus === 'final') {
    const winner = competitors.find((c) => (c.winner as boolean) === true);
    if (winner) winnerId = String((winner.team as Record<string, unknown>)?.id ?? '');
  }
  return {
    id: String(event.id ?? idx),
    round: roundNum,
    position: positionInRound,
    homeTeam: home ? mapCompetitor(home) : undefined,
    awayTeam: away ? mapCompetitor(away) : undefined,
    homeScore: home ? Number((home.score as string) ?? 0) : undefined,
    awayScore: away ? Number((away.score as string) ?? 0) : undefined,
    winnerId,
    status: matchStatus,
    startTime: event.date as string | undefined,
  };
}

// ─── UCL / Soccer-specific bracket logic ─────────────────────────────────────

// UCL uses season.slug to identify rounds; two-legged ties need deduplication.
const UCL_SLUG_ORDER: Record<string, number> = {
  'knockout-round-playoffs': 1,
  'round-of-16': 2,
  'quarterfinals': 3,
  'semifinals': 4,
  'final': 5,
};

const UCL_SLUG_LABELS: Record<string, string> = {
  'knockout-round-playoffs': 'Knockout Playoffs',
  'round-of-16': 'Round of 16',
  'quarterfinals': 'Quarterfinals',
  'semifinals': 'Semifinals',
  'final': 'Final',
};

function getSoccerSeasonRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // UCL season runs Aug → Jun
  const startYear = month >= 6 ? year : year - 1;
  const endYear = startYear + 1;
  return { startDate: `${startYear}0801`, endDate: `${endYear}0701` };
}

function buildUclRounds(events: Array<Record<string, unknown>>): BracketRound[] {
  // Group events by slug, filtering to knockout rounds only
  const bySlug = new Map<string, Array<Record<string, unknown>>>();
  events.forEach((e) => {
    const slug = String((e.season as Record<string, unknown>)?.slug ?? '');
    if (UCL_SLUG_ORDER[slug] === undefined) return; // skip league-phase etc.
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug)!.push(e);
  });

  const rounds: BracketRound[] = [];

  bySlug.forEach((slugEvents, slug) => {
    const roundNum = UCL_SLUG_ORDER[slug];

    // Sort by date ascending so later events (return legs) overwrite earlier ones
    slugEvents.sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));

    // Deduplicate two-legged ties: canonical key = sorted team names from event.name
    // e.g. "Juventus at Galatasaray" and "Galatasaray at Juventus" → same tie
    const tieMap = new Map<string, Record<string, unknown>>();
    slugEvents.forEach((event) => {
      const name = String(event.name ?? event.id ?? '');
      const key = name.split(' at ').map((s) => s.trim()).sort().join('_vs_');
      tieMap.set(key, event); // return leg (later date) overwrites first leg
    });

    const matches: Match[] = [];
    let pos = 0;
    tieMap.forEach((event) => {
      matches.push(buildMatchFromEvent(event, pos, roundNum, pos));
      pos++;
    });

    rounds.push({ roundNumber: roundNum, label: UCL_SLUG_LABELS[slug] ?? slug, matches });
  });

  return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
}

// ─── Main bracket fetcher ────────────────────────────────────────────────────

export async function fetchEspnBracket(leagueId: LeagueId, _season?: string): Promise<Bracket> {
  const isUcl = leagueId === 'ucl';

  let url: string | null;
  if (isUcl) {
    // soccer doesn't support groups=playoff; fetch full season by date range
    const { startDate, endDate } = getSoccerSeasonRange();
    url = espnUrl(leagueId, `scoreboard?limit=200&dates=${startDate}-${endDate}`);
  } else {
    url = espnUrl(leagueId, 'scoreboard?limit=100&groups=playoff');
  }
  if (!url) throw new Error(`No ESPN path for ${leagueId}`);

  const data = await fetchJson<Record<string, unknown>>(url);
  const events = (data.events as Array<Record<string, unknown>>) ?? [];

  let rounds: BracketRound[];

  if (isUcl) {
    rounds = buildUclRounds(events);
  } else {
    // Standard bracket: group by week number
    const roundMap = new Map<number, Match[]>();
    events.forEach((event, idx) => {
      const roundNum = Number((event.week as Record<string, unknown>)?.number ?? 1);
      if (!roundMap.has(roundNum)) roundMap.set(roundNum, []);
      const pos = roundMap.get(roundNum)!.length;
      roundMap.get(roundNum)!.push(buildMatchFromEvent(event, idx, roundNum, pos));
    });
    rounds = Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNum, matches]) => ({
        roundNumber: roundNum,
        label: getRoundLabel(leagueId, roundNum, roundMap.size),
        matches,
      }));
  }

  // Find champion from the final round
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  let champion: Team | undefined;
  if (finalMatch?.status === 'final' && finalMatch.winnerId) {
    champion =
      finalMatch.homeTeam?.id === finalMatch.winnerId
        ? finalMatch.homeTeam
        : finalMatch.awayTeam;
  }

  return {
    id: `espn_${leagueId}_bracket`,
    leagueId,
    season: getDisplaySeason(leagueId),
    rounds,
    champion,
    isOfficial: true,
    updatedAt: new Date().toISOString(),
  };
}

function getRoundLabel(leagueId: LeagueId, round: number, totalRounds: number): string {
  const distanceFromFinal = totalRounds - round;
  if (distanceFromFinal === 0) return 'Championship';
  if (distanceFromFinal === 1) return 'Semifinals';
  if (distanceFromFinal === 2) return 'Conference Finals';

  const roundLabels: Record<LeagueId, Record<number, string>> = {
    nba: { 1: 'First Round', 2: 'Second Round' },
    nfl: { 1: 'Wild Card', 2: 'Divisional', 3: 'Conference Championship' },
    nhl: { 1: 'First Round', 2: 'Second Round' },
    mlb: { 1: 'Wild Card', 2: 'Division Series', 3: 'Championship Series' },
    mls: { 1: 'Round of 16', 2: 'Quarterfinals' },
    ncaa_mm: { 1: 'First Four', 2: 'Round of 64', 3: 'Round of 32', 4: 'Sweet 16', 5: 'Elite Eight' },
    ucl: {},
    fifa_wc: { 1: 'Round of 16', 2: 'Quarterfinals' },
    wbc: { 1: 'Quarterfinals' },
  };

  return roundLabels[leagueId]?.[round] ?? `Round ${round}`;
}
