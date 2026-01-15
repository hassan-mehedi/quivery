import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiLimiter, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * Authentication middleware wrapper for API routes
 *
 * Automatically checks for valid session, applies rate limiting, and provides userId to handler
 * Returns 401 Unauthorized if no valid session
 * Returns 429 Too Many Requests if rate limit exceeded
 *
 * @example
 * // Without params
 * export const GET = withAuth(async (request, userId) => {
 *   const todos = await prisma.todo.findMany({ where: { userId } });
 *   return NextResponse.json(todos);
 * });
 *
 * // With params (dynamic routes)
 * export const GET = withAuth(async (request, userId, context) => {
 *   const { id } = await context.params;
 *   return NextResponse.json({ id });
 * });
 */
export function withAuth<T = Record<string, never>>(
  handler: (
    request: NextRequest,
    userId: string,
    context: T
  ) => Promise<NextResponse>,
  options?: {
    rateLimit?: number; // Max requests per minute (default: 60)
  }
) {
  return async (request: NextRequest, context?: T) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const limit = options?.rateLimit ?? 60;
    const { success } = await apiLimiter.check(session.user.id, limit);

    if (!success) {
      const headers = await getRateLimitHeaders(session.user.id, limit);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers,
        }
      );
    }

    // Execute handler and add rate limit headers to response
    const response = await handler(request, session.user.id, context as T);
    const headers = await getRateLimitHeaders(session.user.id, limit);

    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
