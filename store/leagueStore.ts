import { create } from 'zustand';
import type { League, Bracket, ConferenceStandings, LeagueId, LeagueStatus } from '../types';
import { LEAGUE_CONFIGS, LEAGUE_ORDER, getDisplaySeason } from '../constants/leagues';
import { getStandings, getBracket, getLeagueStatus, getMockLeagueData } from '../lib/sportsApi';

interface LeagueState {
  leagues: League[];
  brackets: Record<LeagueId, Bracket | null>;
  standings: Record<LeagueId, ConferenceStandings[] | null>;
  loadingLeagues: boolean;
  loadingBracket: Record<LeagueId, boolean>;
  loadingStandings: Record<LeagueId, boolean>;

  loadLeagues: () => Promise<void>;
  loadBracket: (leagueId: LeagueId) => Promise<void>;
  loadStandings: (leagueId: LeagueId) => Promise<void>;
  refreshLeague: (leagueId: LeagueId) => Promise<void>;
}

// Build initial league list from constants
function buildInitialLeagues(): League[] {
  return LEAGUE_ORDER.map((id) => ({
    ...LEAGUE_configs_for(id),
    status: 'off_season' as LeagueStatus,
    season: getDisplaySeason(id),
  }));
}

function LEAGUE_configs_for(id: LeagueId) {
  return LEAGUE_CONFIGS[id];
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  leagues: buildInitialLeagues(),
  brackets: {} as Record<LeagueId, Bracket | null>,
  standings: {} as Record<LeagueId, ConferenceStandings[] | null>,
  loadingLeagues: false,
  loadingBracket: {} as Record<LeagueId, boolean>,
  loadingStandings: {} as Record<LeagueId, boolean>,

  loadLeagues: async () => {
    set({ loadingLeagues: true });
    try {
      // Fetch status for all leagues in parallel
      const statusResults = await Promise.allSettled(
        LEAGUE_ORDER.map((id) => getLeagueStatus(id))
      );

      const updatedLeagues = LEAGUE_ORDER.map((id, idx) => {
        const result = statusResults[idx];
        const status: LeagueStatus =
          result.status === 'fulfilled' ? result.value : 'off_season';
        return {
          ...LEAGUE_CONFIGS[id],
          status,
          season: getDisplaySeason(id),
        };
      });

      set({ leagues: updatedLeagues });
    } catch (err) {
      console.warn('[LeagueStore] loadLeagues error:', err);
    } finally {
      set({ loadingLeagues: false });
    }
  },

  loadBracket: async (leagueId) => {
    set((s) => ({
      loadingBracket: { ...s.loadingBracket, [leagueId]: true },
    }));
    try {
      let bracket: Bracket;
      try {
        bracket = await getBracket(leagueId);
      } catch {
        // Fall back to mock data
        bracket = getMockLeagueData(leagueId);
      }
      set((s) => ({
        brackets: { ...s.brackets, [leagueId]: bracket },
      }));
    } finally {
      set((s) => ({
        loadingBracket: { ...s.loadingBracket, [leagueId]: false },
      }));
    }
  },

  loadStandings: async (leagueId) => {
    set((s) => ({
      loadingStandings: { ...s.loadingStandings, [leagueId]: true },
    }));
    try {
      const standings = await getStandings(leagueId);
      set((s) => ({
        standings: { ...s.standings, [leagueId]: standings },
      }));
    } catch (err) {
      console.warn(`[LeagueStore] loadStandings(${leagueId}) error:`, err);
    } finally {
      set((s) => ({
        loadingStandings: { ...s.loadingStandings, [leagueId]: false },
      }));
    }
  },

  refreshLeague: async (leagueId) => {
    const { loadBracket, loadStandings } = get();
    await Promise.all([loadBracket(leagueId), loadStandings(leagueId)]);
  },
}));
