// ─── League ───────────────────────────────────────────────────────────────────

export type LeagueStatus = 'live' | 'upcoming' | 'completed' | 'off_season';

export type LeagueId =
  | 'nba'
  | 'nfl'
  | 'nhl'
  | 'mlb'
  | 'mls'
  | 'ncaa_mm'
  | 'ucl'
  | 'fifa_wc'
  | 'wbc';

export interface League {
  id: LeagueId;
  name: string;
  sport: string;
  status: LeagueStatus;
  season: string;
  playoffStartDate?: string; // ISO date string
  seasonStartDate?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  seed?: number;
  wins?: number;
  losses?: number;
  ties?: number;
}

// ─── Match / Bracket ──────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'live' | 'final' | 'tbd';

export interface Match {
  id: string;
  round: number;
  position: number; // 0-indexed within round
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
  status: MatchStatus;
  startTime?: string; // ISO datetime
  seriesRecord?: string; // e.g. "3-2"
}

export interface BracketRound {
  roundNumber: number;
  label: string; // "First Round", "Conference Semifinals", "Final"
  matches: Match[];
}

export interface Bracket {
  id: string;
  leagueId: LeagueId;
  season: string;
  rounds: BracketRound[];
  champion?: Team;
  isOfficial: boolean;
  updatedAt: string;
}

// ─── Standings ────────────────────────────────────────────────────────────────

export interface StandingsEntry {
  team: Team;
  rank: number;
  wins: number;
  losses: number;
  ties?: number;
  points?: number;
  gamesBack?: number;
  winPct?: number;
  streak?: string;
  last10?: string;
}

export interface ConferenceStandings {
  conference: string;
  entries: StandingsEntry[];
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  pushToken?: string;
  subscriptionTier: 'free' | 'premium';
  totalCorrectPredictions: number;
  totalPredictions: number;
  createdAt: string;
}

// ─── Groups & Predictions ─────────────────────────────────────────────────────

export interface ScoringRules {
  pointsPerRound: number[]; // e.g. [1, 2, 4, 8, 16, 32]
  upsetBonus: number;
  perfectBracketBonus: number;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  leagueId: LeagueId;
  bracketId: string;
  pickDeadline: string; // ISO datetime
  memberCount: number;
  scoringRules: ScoringRules;
  createdAt: string;
  // computed
  userScore?: number;
  userRank?: number;
}

export interface GroupMember {
  userId: string;
  profile: Profile;
  score: number;
  rank: number;
  correctPicks: number;
  totalPicks: number;
}

// Map of matchId → predicted winnerId
export type PredictionMap = Record<string, string>;

export interface UserPrediction {
  id: string;
  userId: string;
  bracketId: string;
  groupId: string;
  predictions: PredictionMap;
  tiebreakerScore?: number;
  score: number;
  correctPicks: number;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'game_result'
  | 'leaderboard_change'
  | 'deadline_reminder'
  | 'friend_joined';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  fromCache: boolean;
}
