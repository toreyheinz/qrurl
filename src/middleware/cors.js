export function cors(request, env) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  return null;
}

export function addCorsHeaders(response, env) {
  // If no FRONTEND_URL is set, we're using unified deployment (no CORS needed)
  if (!env.FRONTEND_URL) {
    return response;
  }
  
  // Add CORS headers for separate frontend deployment
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', env.FRONTEND_URL);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}