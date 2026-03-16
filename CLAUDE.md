# Sports Bracket App — Claude Instructions

## Project Overview
Full-stack cross-platform mobile app for sports bracket predictions. Users join groups, pick winners for upcoming games, and earn points based on correct predictions.

## Tech Stack
- **Framework**: Expo SDK 55, React Native 0.83, React 19
- **Routing**: Expo Router v3 (file-based, app/ directory)
- **Backend**: Supabase (auth, database, edge functions, realtime)
- **State**: Zustand v5
- **Sports data**: ESPN public API (no auth) + TheSportsDB (free key "3")
- **TypeScript**: strict mode, ~5.9.2

## Project Structure
```
app/                    # Expo Router screens
  _layout.tsx           # Root layout (auth guard, fonts)
  index.tsx             # Entry redirect
  (auth)/               # Auth screens (login, register)
  (tabs)/               # Main tab screens (home, leagues, standings, profile)
  modal/                # Modal screens
components/
  bracket/              # Bracket UI components
  groups/               # Group management components
  leagues/              # League components
  notifications/        # Notification components
  standings/            # Standings/leaderboard components
  ui/                   # Shared UI primitives
hooks/
  useAuth.ts
  useGroups.ts
  useLeague.ts
  useNotifications.ts
lib/
  supabase.ts           # Supabase client
  espnApi.ts            # ESPN public API client
  theSportsDb.ts        # TheSportsDB client
  sportsApi.ts          # Unified sports data layer
  scoring.ts            # Prediction scoring logic
  cache.ts              # Local cache utilities
  notifications.ts      # Push notification helpers
store/
  authStore.ts          # Auth state (Zustand)
  groupStore.ts         # Groups state
  leagueStore.ts        # Leagues/brackets state
types/
  index.ts              # All shared TypeScript types
supabase/
  schema.sql            # Full DB schema — run in Supabase SQL Editor
  rls.sql               # Row-level security policies
  functions/
    calculate-scores/   # Edge function: score predictions after games
    send-notifications/ # Edge function: push notifications
```

## Key Conventions
- **Package installs**: Always use `--legacy-peer-deps` for npm; use `npx expo install` for native modules
- **Refs**: `useRef<T>(undefined)` not `useRef<T>()` (React 19 requirement)
- **Reanimated**: v4.x API (not v3)
- **Supabase edge functions**: Deno runtime — excluded from tsconfig
- **No default exports on components** — use named exports
- **Zustand stores**: use `create` with TypeScript generic, keep actions inside the store

## Environment Setup
Create a `.env` file in the project root (not committed):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup (not yet done)
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/rls.sql` in SQL Editor
4. Add env vars above
5. Deploy edge functions: `supabase functions deploy calculate-scores && supabase functions deploy send-notifications`

## Running the App
```bash
npx expo start          # Start dev server
npx expo run:ios        # Build and run on iOS simulator
npx expo run:android    # Build and run on Android emulator
```

## Status
- App code: complete, 0 TypeScript errors
- Supabase schema + RLS: written, not yet applied to a live project
- Edge functions: scaffolded, not yet deployed
- Device testing: not yet done
