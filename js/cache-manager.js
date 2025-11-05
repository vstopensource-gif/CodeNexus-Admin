// Cache manager for Firebase data to reduce reads
// Cache persists until manually refreshed (no auto-expiration)
const CACHE_KEYS = {
  USERS: 'codenexus_cache_users',
  REGISTRATIONS: 'codenexus_cache_registrations',
  OVERVIEW: 'codenexus_cache_overview'
};

export function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      console.log(`[Cache] No cached data found for ${key}`);
      return null;
    }

    const { data } = JSON.parse(cached);
    console.log(`[Cache] Using cached data for ${key} (count: ${data?.length || 'N/A'})`);
    return data;
  } catch (error) {
    console.warn(`[Cache] Error reading cache for ${key}:`, error);
    // Clear corrupted cache
    localStorage.removeItem(key);
    return null;
  }
}

export function setCachedData(key, data) {
  try {
    const cache = {
      data,
      timestamp: Date.now() // Store timestamp for reference only, not for expiration
    };
    localStorage.setItem(key, JSON.stringify(cache));
    console.log(`[Cache] Cached data for ${key} (count: ${data?.length || 'N/A'})`);
  } catch (error) {
    console.warn(`[Cache] Error setting cache for ${key}:`, error);
    // If storage is full, clear old cache
    if (error.name === 'QuotaExceededError') {
      clearAllCache();
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {
        console.error('[Cache] Storage full, cannot cache:', e);
      }
    }
  }
}

export function clearCache(key) {
  localStorage.removeItem(key);
  console.log(`[Cache] Cleared cache for ${key}`);
}

export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('[Cache] Cleared all cache');
}

export function getCacheAge(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { timestamp } = JSON.parse(cached);
    return Date.now() - timestamp;
  } catch {
    return null;
  }
}

export { CACHE_KEYS };
