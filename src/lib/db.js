import { NotFoundError, ValidationError } from '../utils/errors';

export class Database {
  constructor(db) {
    this.db = db;
  }

  // User operations
  async createUser(id, email) {
    const stmt = this.db.prepare(
      'INSERT INTO users (id, email) VALUES (?, ?)'
    );
    return await stmt.bind(id, email).run();
  }

  async getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return await stmt.bind(email).first();
  }

  async getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return await stmt.bind(id).first();
  }

  // Authorization operations
  async isEmailAuthorized(email) {
    const stmt = this.db.prepare(
      'SELECT * FROM authorized_emails WHERE email = ? AND authorized = true'
    );
    const result = await stmt.bind(email).first();
    return !!result;
  }

  async addAuthorizedEmail(email) {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO authorized_emails (email) VALUES (?)'
    );
    return await stmt.bind(email).run();
  }

  // Entry operations
  async createEntry(data) {
    const { id, userId, name, originalUrl, slug, logoUrl } = data;
    const stmt = this.db.prepare(
      `INSERT INTO entries (id, user_id, name, original_url, slug, logo_url) 
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    return await stmt.bind(id, userId, name, originalUrl, slug, logoUrl).run();
  }

  async getEntryBySlug(slug) {
    const stmt = this.db.prepare('SELECT * FROM entries WHERE slug = ?');
    return await stmt.bind(slug).first();
  }

  async getEntryById(id) {
    const stmt = this.db.prepare('SELECT * FROM entries WHERE id = ?');
    return await stmt.bind(id).first();
  }

  async getUserEntries(userId, limit = 50, offset = 0) {
    const stmt = this.db.prepare(
      `SELECT * FROM entries 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    );
    const result = await stmt.bind(userId, limit, offset).all();
    return result.results;
  }

  async updateEntry(id, updates) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case
      const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${dbField} = ?`);
      values.push(value);
    }
    
    values.push(id);
    const stmt = this.db.prepare(
      `UPDATE entries 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    );
    return await stmt.bind(...values).run();
  }

  async deleteEntry(id) {
    const stmt = this.db.prepare('DELETE FROM entries WHERE id = ?');
    return await stmt.bind(id).run();
  }

  async incrementClickCount(slug) {
    const stmt = this.db.prepare(
      'UPDATE entries SET click_count = click_count + 1 WHERE slug = ?'
    );
    return await stmt.bind(slug).run();
  }

  // Analytics operations
  async recordAnalytics(data) {
    const { entryId, ipHash, userAgent, referer, country, city } = data;
    const stmt = this.db.prepare(
      `INSERT INTO analytics (entry_id, ip_hash, user_agent, referer, country, city) 
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    return await stmt.bind(entryId, ipHash, userAgent, referer, country, city).run();
  }

  async getEntryAnalytics(entryId, days = 30) {
    const stmt = this.db.prepare(
      `SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_hash) as unique_visitors,
        DATE(timestamp) as date,
        country,
        COUNT(*) as clicks
       FROM analytics 
       WHERE entry_id = ? 
         AND timestamp > datetime('now', '-' || ? || ' days')
       GROUP BY DATE(timestamp), country
       ORDER BY date DESC`
    );
    const result = await stmt.bind(entryId, days).all();
    return result.results;
  }

  // Auth token operations
  async createAuthToken(token, email, expiresAt) {
    const stmt = this.db.prepare(
      'INSERT INTO auth_tokens (token, email, expires_at) VALUES (?, ?, ?)'
    );
    return await stmt.bind(token, email, expiresAt).run();
  }

  async getAuthToken(token) {
    const stmt = this.db.prepare(
      `SELECT * FROM auth_tokens 
       WHERE token = ? 
         AND expires_at > datetime('now') 
         AND used = false`
    );
    return await stmt.bind(token).first();
  }

  async markTokenUsed(token) {
    const stmt = this.db.prepare(
      'UPDATE auth_tokens SET used = true WHERE token = ?'
    );
    return await stmt.bind(token).run();
  }

  async cleanupExpiredTokens() {
    const stmt = this.db.prepare(
      'DELETE FROM auth_tokens WHERE expires_at < datetime("now")'
    );
    return await stmt.run();
  }
}