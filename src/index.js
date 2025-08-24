import { Router } from './router';
import { handleRedirect } from './routes/redirect';
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { applyMiddleware } from './middleware';
import { handleError } from './utils/errors';
import { addCorsHeaders } from './middleware/cors';

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle OPTIONS preflight requests
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

      const router = new Router();
      
      // Health check
      router.get('/health', () => {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString() 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });

      // API routes
      router.all('/api/auth/*', authRoutes);
      router.all('/api/*', (request, env, ctx) => 
        applyMiddleware(request, env, ctx, apiRoutes)
      );

      // Redirect handler (must be last)
      router.get('/:slug', handleRedirect);

      // Default route
      router.all('*', () => {
        return new Response(JSON.stringify({ 
          error: 'Not Found',
          message: 'The requested resource was not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      });

      const response = await router.handle(request, env, ctx);
      
      // Add CORS headers to all responses
      return addCorsHeaders(response, env);
    } catch (error) {
      const errorResponse = handleError(error);
      return addCorsHeaders(errorResponse, env);
    }
  }
};