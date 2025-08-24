// Static file serving for frontend
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

const MIME_TYPES = {
  'html': 'text/html',
  'js': 'application/javascript',
  'css': 'text/css',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'json': 'application/json',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
  'eot': 'font/eot'
};

export async function serveStaticAsset(request, env, ctx) {
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Default to index.html for root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  
  // For client-side routing, serve index.html for non-asset paths
  const ext = pathname.split('.').pop();
  if (!MIME_TYPES[ext] && !pathname.startsWith('/api') && !pathname.startsWith('/health')) {
    pathname = '/index.html';
  }
  
  try {
    // Try to get the asset from R2 bucket (FRONTEND_ASSETS)
    if (env.FRONTEND_ASSETS) {
      const object = await env.FRONTEND_ASSETS.get(pathname.slice(1)); // Remove leading slash
      
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=3600');
        
        return new Response(object.body, {
          status: 200,
          headers
        });
      }
    }
    
    // Fallback to KV if configured (for Cloudflare Pages migration)
    if (env.__STATIC_CONTENT) {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST || '{}'),
        }
      );
    }
    
    return null;
  } catch (e) {
    console.error('Static asset error:', e);
    return null;
  }
}