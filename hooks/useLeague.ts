import { useEffect, useRef } from 'react';
import { useLeagueStore } from '../store/leagueStore';
import type { LeagueId } from '../types';

export function useLeagues() {
  const { leagues, loadingLeagues, loadLeagues } = useLeagueStore();

  useEffect(() => {
    loadLeagues();
  }, []);

  return { leagues, loading: loadingLeagues, refresh: loadLeagues };
}

export function useLeague(leagueId: LeagueId) {
  const store = useLeagueStore();
  const league = store.leagues.find((l) => l.id === leagueId);
  const bracket = store.brackets[leagueId] ?? null;
  const standings = store.standings[leagueId] ?? null;
  const loadingBracket = store.loadingBracket[leagueId] ?? false;
  const loadingStandings = store.loadingStandings[leagueId] ?? false;

  useEffect(() => {
    if (!bracket && !loadingBracket) {
      store.loadBracket(leagueId);
    }
  }, [leagueId]);

  useEffect(() => {
    if (!standings && !loadingStandings) {
      store.loadStandings(leagueId);
    }
  }, [leagueId]);

  // Auto-poll scores every 30s while the league is live
  useEffect(() => {
    if (league?.status !== 'live') return;
    const interval = setInterval(() => {
      store.refreshLeague(leagueId);
    }, 30_000);
    return () => clearInterval(interval);
  }, [leagueId, league?.status]);

  return {
    league,
    bracket,
    standings,
    loadingBracket,
    loadingStandings,
    refresh: () => store.refreshLeague(leagueId),
  };
}
