import { AuthError } from '../utils/errors';

export async function verifyAuth(request, env) {
  // Skip auth for public endpoints
  const url = new URL(request.url);
  const publicPaths = ['/health', '/api/health', '/api/auth/request', '/api/auth/verify'];
  
  // Skip auth for logo serving (public endpoint)
  if (url.pathname.startsWith('/api/logo/get/')) {
    return null;
  }
  
  // Skip auth for non-API paths (like redirects) or public API paths
  if (!url.pathname.startsWith('/api') || publicPaths.includes(url.pathname)) {
    return null;
  }

  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT token
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    // Add user info to request
    request.user = {
      id: payload.sub,
      email: payload.email
    };
    
    return null; // Continue to handler
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function createJWT(payload, secret, expiresIn = '7d') {
  const encoder = new TextEncoder();
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn === '7d' ? now + (7 * 24 * 60 * 60) : now + 3600;
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${message}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  const encoder = new TextEncoder();
  const [header, payload, signature] = token.split('.');
  
  if (!header || !payload || !signature) {
    throw new Error('Invalid token format');
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const message = `${header}.${payload}`;
  const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(message)
  );
  
  if (!valid) {
    throw new Error('Invalid signature');
  }
  
  const decodedPayload = JSON.parse(atob(payload));
  
  // Check expiration
  if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return decodedPayload;
}