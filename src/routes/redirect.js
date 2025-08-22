import { Database } from '../lib/db';
import { NotFoundError } from '../utils/errors';

export async function handleRedirect(request, env, ctx) {
  const { slug } = request.params;
  
  if (!slug) {
    return new Response('Not Found', { status: 404 });
  }
  
  try {
    const db = new Database(env.DB);
    
    // Try to get from cache first
    let entry;
    if (env.CACHE) {
      const cached = await env.CACHE.get(`entry:${slug}`, 'json');
      if (cached) {
        entry = cached;
      }
    }
    
    // If not in cache, get from database
    if (!entry) {
      entry = await db.getEntryBySlug(slug);
      if (!entry) {
        return new Response('Not Found', { status: 404 });
      }
      
      // Cache for 5 minutes
      if (env.CACHE) {
        await env.CACHE.put(`entry:${slug}`, JSON.stringify(entry), {
          expirationTtl: 300
        });
      }
    }
    
    // Record analytics asynchronously
    ctx.waitUntil(recordAnalytics(request, env, entry.id));
    
    // Increment click count asynchronously
    ctx.waitUntil(db.incrementClickCount(slug));
    
    // Redirect to the original URL
    return Response.redirect(entry.original_url, 301);
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response('Not Found', { status: 404 });
  }
}

async function recordAnalytics(request, env, entryId) {
  try {
    const db = new Database(env.DB);
    
    // Get client info
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const referer = request.headers.get('Referer') || null;
    const country = request.cf?.country || null;
    const city = request.cf?.city || null;
    
    // Hash IP for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + env.JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    await db.recordAnalytics({
      entryId,
      ipHash: ipHash.substring(0, 16), // Use first 16 chars of hash
      userAgent: userAgent.substring(0, 255),
      referer: referer ? referer.substring(0, 255) : null,
      country,
      city
    });
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't throw - analytics shouldn't break redirects
  }
}