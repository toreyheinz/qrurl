export class Router {
  constructor() {
    this.routes = [];
  }

  addRoute(method, pattern, handler) {
    this.routes.push({ method, pattern, handler });
  }

  get(pattern, handler) {
    this.addRoute('GET', pattern, handler);
  }

  post(pattern, handler) {
    this.addRoute('POST', pattern, handler);
  }

  put(pattern, handler) {
    this.addRoute('PUT', pattern, handler);
  }

  delete(pattern, handler) {
    this.addRoute('DELETE', pattern, handler);
  }

  all(pattern, handler) {
    this.addRoute('*', pattern, handler);
  }

  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== '*' && route.method !== method) continue;

      const params = this.matchRoute(route.pattern, path);
      if (params) {
        request.params = params;
        request.query = Object.fromEntries(url.searchParams);
        return await route.handler(request, env, ctx);
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  matchRoute(pattern, path) {
    if (pattern === '*') return {};
    
    // Handle wildcard patterns like /api/*
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      if (path.startsWith(base + '/') || path === base) {
        return {};
      }
      return null;
    }

    // Handle exact matches
    if (pattern === path) return {};

    // Handle parameterized routes like /:slug
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }
}