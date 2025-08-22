// Custom alphabet without confusing characters (no 0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

export function generateSlug(length = 7) {
  let slug = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[randomValues[i] % ALPHABET.length];
  }
  
  return slug;
}

export function validateCustomSlug(slug) {
  // Allow alphanumeric and hyphens, 3-50 characters
  const pattern = /^[a-zA-Z0-9-]{3,50}$/;
  
  if (!pattern.test(slug)) {
    throw new Error('Slug must be 3-50 characters and contain only letters, numbers, and hyphens');
  }
  
  // Don't allow reserved paths
  const reserved = ['api', 'health', 'auth', 'admin', 'dashboard', 'login', 'logout'];
  if (reserved.includes(slug.toLowerCase())) {
    throw new Error('This slug is reserved');
  }
  
  return true;
}