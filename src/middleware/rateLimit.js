export async function rateLimit(request, env) {
  // Get client IP
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  
  // Skip rate limiting for health checks
  const url = new URL(request.url);
  if (url.pathname === '/health') {
    return null;
  }
  
  // Simple rate limiting using KV
  if (env.CACHE) {
    const key = `ratelimit:${ip}`;
    const now = Date.now();
    const window = 60000; // 1 minute window
    const limit = 60; // 60 requests per minute
    
    const data = await env.CACHE.get(key, 'json');
    
    if (data) {
      // Reset if window has passed
      if (now - data.start > window) {
        await env.CACHE.put(key, JSON.stringify({
          start: now,
          count: 1
        }), { expirationTtl: 60 });
        return null;
      }
      
      // Check if limit exceeded
      if (data.count >= limit) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((data.start + window - now) / 1000)
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((data.start + window - now) / 1000))
          }
        });
      }
      
      // Increment counter
      await env.CACHE.put(key, JSON.stringify({
        ...data,
        count: data.count + 1
      }), { expirationTtl: 60 });
    } else {
      // First request
      await env.CACHE.put(key, JSON.stringify({
        start: now,
        count: 1
      }), { expirationTtl: 60 });
    }
  }
  
  return null;
}