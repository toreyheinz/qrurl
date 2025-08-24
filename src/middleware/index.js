import { verifyAuth } from './auth';
import { rateLimit } from './rateLimit';

export async function applyMiddleware(request, env, ctx, handler) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, env);
  if (rateLimitResponse) return rateLimitResponse;

  // Apply auth middleware for protected routes
  const authResponse = await verifyAuth(request, env);
  if (authResponse) return authResponse;

  // Call the actual handler
  return handler(request, env, ctx);
}