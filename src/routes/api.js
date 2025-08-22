import { Database } from '../lib/db';
import { generateSlug, validateCustomSlug } from '../utils/slug';
import { validateUrl, sanitizeInput } from '../utils/validation';
import { ValidationError, NotFoundError, AuthError } from '../utils/errors';

export async function apiRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Entry routes
  if (path === '/api/entries' && method === 'GET') {
    return getUserEntries(request, env);
  }
  
  if (path === '/api/entries' && method === 'POST') {
    return createEntry(request, env);
  }
  
  if (path.startsWith('/api/entries/') && method === 'GET') {
    const id = path.split('/')[3];
    return getEntry(request, env, id);
  }
  
  if (path.startsWith('/api/entries/') && method === 'PUT') {
    const id = path.split('/')[3];
    return updateEntry(request, env, id);
  }
  
  if (path.startsWith('/api/entries/') && method === 'DELETE') {
    const id = path.split('/')[3];
    return deleteEntry(request, env, id);
  }
  
  // Analytics routes
  if (path.startsWith('/api/analytics/')) {
    const id = path.split('/')[3];
    return getAnalytics(request, env, id);
  }
  
  return new Response('Not Found', { status: 404 });
}

async function getUserEntries(request, env) {
  try {
    const db = new Database(env.DB);
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const entries = await db.getUserEntries(request.user.id, limit, offset);
    
    return new Response(JSON.stringify({ 
      success: true,
      entries 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get entries error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch entries' 
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function createEntry(request, env) {
  try {
    const body = await request.json();
    const { name, url, customSlug, logoUrl } = body;
    
    // Validate inputs
    if (!name || !url) {
      throw new ValidationError('Name and URL are required');
    }
    
    validateUrl(url);
    const sanitizedName = sanitizeInput(name);
    
    // Generate or validate slug
    let slug;
    if (customSlug) {
      validateCustomSlug(customSlug);
      slug = customSlug;
    } else {
      slug = generateSlug();
    }
    
    const db = new Database(env.DB);
    
    // Check if slug already exists
    const existing = await db.getEntryBySlug(slug);
    if (existing) {
      // If custom slug, throw error
      if (customSlug) {
        throw new ValidationError('This slug is already in use');
      }
      // Otherwise, generate a new one
      slug = generateSlug(8); // Try with longer slug
    }
    
    // Create entry
    const entryId = crypto.randomUUID();
    await db.createEntry({
      id: entryId,
      userId: request.user.id,
      name: sanitizedName,
      originalUrl: url,
      slug,
      logoUrl: logoUrl || null
    });
    
    // Clear cache for user entries
    if (env.CACHE) {
      await env.CACHE.delete(`user-entries:${request.user.id}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      entry: {
        id: entryId,
        name: sanitizedName,
        originalUrl: url,
        slug,
        shortUrl: `${env.BACKEND_URL}/${slug}`,
        logoUrl: logoUrl || null
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create entry error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create entry' 
    }), {
      status: error.status || 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getEntry(request, env, id) {
  try {
    const db = new Database(env.DB);
    const entry = await db.getEntryById(id);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }
    
    // Check ownership
    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to view this entry');
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      entry 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get entry error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch entry' 
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateEntry(request, env, id) {
  try {
    const body = await request.json();
    const { name, url, logoUrl } = body;
    
    const db = new Database(env.DB);
    const entry = await db.getEntryById(id);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }
    
    // Check ownership
    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to update this entry');
    }
    
    const updates = {};
    
    if (name !== undefined) {
      updates.name = sanitizeInput(name);
    }
    
    if (url !== undefined) {
      validateUrl(url);
      updates.originalUrl = url;
    }
    
    if (logoUrl !== undefined) {
      updates.logoUrl = logoUrl;
    }
    
    if (Object.keys(updates).length > 0) {
      await db.updateEntry(id, updates);
      
      // Clear cache
      if (env.CACHE) {
        await env.CACHE.delete(`entry:${entry.slug}`);
        await env.CACHE.delete(`user-entries:${request.user.id}`);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Entry updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update entry error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to update entry' 
    }), {
      status: error.status || 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function deleteEntry(request, env, id) {
  try {
    const db = new Database(env.DB);
    const entry = await db.getEntryById(id);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }
    
    // Check ownership
    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to delete this entry');
    }
    
    await db.deleteEntry(id);
    
    // Clear cache
    if (env.CACHE) {
      await env.CACHE.delete(`entry:${entry.slug}`);
      await env.CACHE.delete(`user-entries:${request.user.id}`);
    }
    
    // TODO: Delete associated QR code from R2
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Entry deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to delete entry' 
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getAnalytics(request, env, id) {
  try {
    const db = new Database(env.DB);
    const entry = await db.getEntryById(id);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }
    
    // Check ownership
    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to view analytics for this entry');
    }
    
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const analytics = await db.getEntryAnalytics(id, days);
    
    return new Response(JSON.stringify({ 
      success: true,
      entry: {
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        clickCount: entry.click_count
      },
      analytics 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch analytics' 
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}