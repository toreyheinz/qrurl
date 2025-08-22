export function validateUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol');
    }
    
    // Prevent javascript: and data: URIs
    if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
      throw new Error('Invalid URL protocol');
    }
    
    return true;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

export function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!pattern.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Basic length check
  if (email.length > 255) {
    throw new Error('Email address too long');
  }
  
  return true;
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove any HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}