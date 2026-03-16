import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'sba_cache_';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// TTL presets in milliseconds
export const TTL = {
  LIVE: 5 * 60 * 1000,        // 5 minutes — live scores/bracket
  STANDINGS: 60 * 60 * 1000,  // 1 hour — standings
  TEAMS: 24 * 60 * 60 * 1000, // 24 hours — team info
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days — rarely changing data
} as const;

// In-memory cache for the current session (faster than AsyncStorage)
const memCache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(key: string): Promise<T | null> {
  const now = Date.now();

  // Check in-memory first
  const mem = memCache.get(key);
  if (mem && mem.expiresAt > now) {
    return mem.data as T;
  }

  // Fall back to AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.expiresAt <= now) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    // Warm the in-memory cache
    memCache.set(key, entry as CacheEntry<unknown>);
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };
  // Write to both
  memCache.set(key, entry as CacheEntry<unknown>);
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full — in-memory still works
  }
}

export async function invalidateCache(keyPrefix: string): Promise<void> {
  // Clear matching keys from in-memory cache
  for (const key of memCache.keys()) {
    if (key.startsWith(keyPrefix)) memCache.delete(key);
  }
  // Clear from AsyncStorage
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter((k) =>
      k.startsWith(CACHE_PREFIX + keyPrefix)
    );
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
  } catch {
    // ignore
  }
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  await setCached(key, fresh, ttl);
  return fresh;
}
