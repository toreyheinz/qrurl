export class Storage {
  constructor(r2Bucket) {
    this.bucket = r2Bucket;
  }

  /**
   * Upload a logo image to R2
   * @param {string} key - The storage key (e.g., 'logos/user-id/filename.png')
   * @param {ArrayBuffer|ReadableStream} data - The image data
   * @param {string} contentType - The MIME type of the image
   * @returns {Promise<{key: string, url: string}>}
   */
  async uploadLogo(key, data, contentType) {
    try {
      const object = await this.bucket.put(key, data, {
        httpMetadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        }
      });

      if (!object) {
        throw new Error('Failed to upload logo');
      }

      // Return the key for later retrieval
      // In production, you might want to use a CDN URL here
      return {
        key: key,
        etag: object.etag,
        uploaded: object.uploaded
      };
    } catch (error) {
      console.error('Logo upload error:', error);
      throw new Error('Failed to upload logo to storage');
    }
  }

  /**
   * Get a logo from R2
   * @param {string} key - The storage key
   * @returns {Promise<Response>}
   */
  async getLogo(key) {
    try {
      const object = await this.bucket.get(key);
      
      if (!object) {
        return null;
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'image/png',
          'Cache-Control': 'public, max-age=31536000',
          'ETag': object.etag
        }
      });
    } catch (error) {
      console.error('Logo fetch error:', error);
      return null;
    }
  }

  /**
   * Delete a logo from R2
   * @param {string} key - The storage key
   * @returns {Promise<void>}
   */
  async deleteLogo(key) {
    try {
      await this.bucket.delete(key);
    } catch (error) {
      console.error('Logo deletion error:', error);
      // Don't throw - deletion failures shouldn't break the flow
    }
  }

  /**
   * Generate a unique storage key for a logo
   * @param {string} userId - The user ID
   * @param {string} entryId - The entry ID
   * @param {string} filename - Original filename
   * @returns {string}
   */
  static generateLogoKey(userId, entryId, filename) {
    // Extract extension from filename
    const ext = filename.split('.').pop().toLowerCase();
    
    // Validate extension
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error('Invalid file type. Allowed: PNG, JPG, SVG, WebP');
    }

    // Generate unique key: logos/userId/entryId.extension
    return `logos/${userId}/${entryId}.${ext}`;
  }

  /**
   * Validate image file
   * @param {File|ArrayBuffer} file - The image file
   * @param {number} maxSize - Maximum size in bytes (default: 5MB)
   * @returns {boolean}
   */
  static validateImage(file, maxSize = 5 * 1024 * 1024) {
    // Check size
    const size = file.size || file.byteLength;
    if (size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type if available
    if (file.type) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: PNG, JPG, SVG, WebP');
      }
    }

    return true;
  }
}