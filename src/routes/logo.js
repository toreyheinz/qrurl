import { Storage } from '../lib/storage';
import { Database } from '../lib/db';
import { AuthError, ValidationError, NotFoundError } from '../utils/errors';

export async function logoRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Upload logo for an entry
  if (path === '/api/logo/upload' && request.method === 'POST') {
    return uploadLogo(request, env);
  }

  // Get logo by key (public endpoint for serving logos)
  if (path.startsWith('/api/logo/get/') && request.method === 'GET') {
    const key = path.replace('/api/logo/get/', '');
    return getLogo(key, env);
  }

  // Delete logo for an entry
  if (path.startsWith('/api/logo/delete/') && request.method === 'DELETE') {
    const entryId = path.replace('/api/logo/delete/', '');
    return deleteLogo(request, env, entryId);
  }

  return new Response('Not Found', { status: 404 });
}

async function uploadLogo(request, env) {
  try {
    // Check authentication
    if (!request.user) {
      throw new AuthError('Authentication required');
    }

    // Parse multipart form data
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      throw new ValidationError('Content-Type must be multipart/form-data');
    }

    const formData = await request.formData();
    const file = formData.get('logo');
    const entryId = formData.get('entryId');

    console.log('Upload request - File:', file?.name, 'Size:', file?.size, 'Type:', file?.type);

    if (!file || !entryId) {
      throw new ValidationError('Logo file and entry ID are required');
    }

    // Validate file
    Storage.validateImage(file);

    // Verify entry ownership
    const db = new Database(env.DB);
    const entry = await db.getEntryById(entryId);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }

    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to update this entry');
    }

    // Delete old logo if exists
    if (entry.logo_url) {
      const storage = new Storage(env.STORAGE);
      const oldKey = entry.logo_url.replace('/api/logo/get/', '');
      await storage.deleteLogo(oldKey);
    }

    // Generate storage key
    const key = Storage.generateLogoKey(request.user.id, entryId, file.name);
    console.log('Generated storage key:', key);

    // Upload to R2
    const storage = new Storage(env.STORAGE);
    const arrayBuffer = await file.arrayBuffer();
    console.log('Uploading to R2, size:', arrayBuffer.byteLength);
    
    const result = await storage.uploadLogo(key, arrayBuffer, file.type);
    console.log('Upload result:', result);

    // Update database with logo URL
    const logoUrl = `/api/logo/get/${key}`;
    await db.updateEntry(entryId, { logoUrl });

    // Clear cache
    if (env.CACHE) {
      await env.CACHE.delete(`entry:${entry.slug}`);
      await env.CACHE.delete(`user-entries:${request.user.id}`);
    }

    return new Response(JSON.stringify({
      success: true,
      logoUrl: logoUrl,
      key: result.key
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to upload logo'
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getLogo(key, env) {
  try {
    console.log('Fetching logo with key:', key);
    const storage = new Storage(env.STORAGE);
    const response = await storage.getLogo(key);

    if (!response) {
      console.log('Logo not found in R2:', key);
      return new Response('Logo not found', { status: 404 });
    }

    console.log('Logo found, returning response');
    return response;
  } catch (error) {
    console.error('Logo fetch error:', error);
    return new Response('Failed to fetch logo', { status: 500 });
  }
}

async function deleteLogo(request, env, entryId) {
  try {
    // Check authentication
    if (!request.user) {
      throw new AuthError('Authentication required');
    }

    // Verify entry ownership
    const db = new Database(env.DB);
    const entry = await db.getEntryById(entryId);
    
    if (!entry) {
      throw new NotFoundError('Entry not found');
    }

    if (entry.user_id !== request.user.id) {
      throw new AuthError('You do not have permission to update this entry');
    }

    // Delete logo from R2
    if (entry.logo_url) {
      const storage = new Storage(env.STORAGE);
      const key = entry.logo_url.replace('/api/logo/get/', '');
      await storage.deleteLogo(key);

      // Update database
      await db.updateEntry(entryId, { logoUrl: null });

      // Clear cache
      if (env.CACHE) {
        await env.CACHE.delete(`entry:${entry.slug}`);
        await env.CACHE.delete(`user-entries:${request.user.id}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Logo deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logo deletion error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to delete logo'
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}