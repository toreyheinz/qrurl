import { Router } from './router';
import { handleRedirect } from './routes/redirect';
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { applyMiddleware } from './middleware';
import { handleError } from './utils/errors';

export default {
  async fetch(request, env, ctx) {
    try {
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

      return await router.handle(request, env, ctx);
    } catch (error) {
      return handleError(error);
    }
  }
};