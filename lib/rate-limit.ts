import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens to track
};

/**
 * Create a rate limiter using LRU cache
 *
 * @example
 * const limiter = rateLimit({
 *   interval: 60 * 1000, // 1 minute
 *   uniqueTokenPerInterval: 500, // Track 500 unique users
 * });
 *
 * const allowed = await limiter.check(userId, 60); // 60 requests per minute
 */
export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: async (token: string, limit: number): Promise<{ success: boolean; currentUsage: number; limit: number; resetTime: number }> => {
      const now = Date.now();
      const tokenCount = tokenCache.get(token) || [0];

      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount);
      }

      tokenCount[0] += 1;
      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage > limit;
      const resetTime = now + options.interval;

      return {
        success: !isRateLimited,
        currentUsage,
        limit,
        resetTime,
      };
    },
  };
}

// Global rate limiters for different endpoints
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 1000,
});

/**
 * Check if a request should be rate limited
 *
 * @param userId - User identifier
 * @param limit - Max requests allowed in the time window
 * @param limiter - Rate limiter to use (default: apiLimiter)
 * @returns true if rate limit is exceeded
 */
export async function isRateLimited(
  userId: string,
  limit = 60,
  limiter = apiLimiter
): Promise<boolean> {
  const { success } = await limiter.check(userId, limit);
  return !success;
}

/**
 * Get rate limit info for response headers
 */
export async function getRateLimitHeaders(
  userId: string,
  limit = 60,
  limiter = apiLimiter
) {
  const result = await limiter.check(userId, limit);

  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, limit - result.currentUsage).toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };
}
