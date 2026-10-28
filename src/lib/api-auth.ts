import { firebaseConfig } from '@/firebase/config';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Clean up old rate limit entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Checks and increments rate limit for a given key (e.g. IP address + route)
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Extracts client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

const MASTER_ADMIN_EMAILS = [
  'tharushyamagara@gmail.com',
  'orverxi@gmail.com',
  (process.env.MASTER_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

export interface AuthValidationResult {
  authorized: boolean;
  userEmail?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Verifies if the incoming request is authorized to perform privileged email operations.
 * Accepts:
 * 1. Admin API Secret via `x-admin-key` header or `Authorization: Bearer <ADMIN_API_SECRET>`
 * 2. Firebase ID Token via `Authorization: Bearer <idToken>`, verified with Google Identity Toolkit
 */
export async function verifyAdminAuthorization(request: Request): Promise<AuthValidationResult> {
  const authHeader = request.headers.get('authorization') || '';
  const adminKeyHeader = request.headers.get('x-admin-key') || '';
  const adminSecret = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;

  // 1. Check Admin Secret Header if configured
  if (adminSecret && adminSecret.length >= 8) {
    if (adminKeyHeader === adminSecret) {
      return { authorized: true, userEmail: 'system-admin-secret' };
    }
    if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === adminSecret) {
      return { authorized: true, userEmail: 'system-admin-secret' };
    }
  }

  // 2. Check Firebase ID Token
  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
      return { authorized: false, error: 'Authorization token is empty', statusCode: 401 };
    }

    try {
      // Verify token with Firebase REST API (Google Identity Toolkit)
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyRes.ok) {
        return { authorized: false, error: 'Invalid or expired authentication token', statusCode: 401 };
      }

      const userData = await verifyRes.json();
      const user = userData?.users?.[0];
      if (!user || !user.email) {
        return { authorized: false, error: 'Authenticated user profile not found', statusCode: 401 };
      }

      const userEmail = user.email.toLowerCase().trim();
      let customAttributes: any = {};
      try {
        if (user.customAttributes) {
          customAttributes = JSON.parse(user.customAttributes);
        }
      } catch {
        // ignore parse errors
      }

      const isAdmin =
        customAttributes?.admin === true ||
        MASTER_ADMIN_EMAILS.includes(userEmail);

      if (!isAdmin) {
        return {
          authorized: false,
          userEmail,
          error: 'Forbidden: User does not have administrative privileges for email operations',
          statusCode: 403,
        };
      }

      return { authorized: true, userEmail };
    } catch (err: any) {
      console.error('[verifyAdminAuthorization] Error verifying ID token:', err.message);
      return { authorized: false, error: 'Authentication service unavailable', statusCode: 503 };
    }
  }

  // In development mode (NODE_ENV !== 'production'), if neither token nor secret is passed,
  // allow local dev requests from localhost for frictionless developer testing.
  if (process.env.NODE_ENV !== 'production') {
    const ip = getClientIp(request);
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return { authorized: true, userEmail: 'dev-localhost' };
    }
  }

  return {
    authorized: false,
    error: 'Missing Authorization header. Provide a valid Bearer token or x-admin-key.',
    statusCode: 401,
  };
}
