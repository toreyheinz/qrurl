import { verifyAuth } from './auth';
import { rateLimit } from './rateLimit';
import { cors } from './cors';

export async function applyMiddleware(request, env, ctx, handler) {
  // Apply CORS
  const corsResponse = cors(request, env);
  if (corsResponse) return corsResponse;

  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, env);
  if (rateLimitResponse) return rateLimitResponse;

  // Apply auth middleware for protected routes
  const authResponse = await verifyAuth(request, env);
  if (authResponse) return authResponse;

  // Call the actual handler
  return handler(request, env, ctx);
}