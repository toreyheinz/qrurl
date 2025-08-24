import { Database } from '../lib/db';
import { createJWT } from '../middleware/auth';
import { validateEmail } from '../utils/validation';
import { ValidationError, AuthError } from '../utils/errors';

export async function authRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === '/api/auth/request' && request.method === 'POST') {
    return requestMagicLink(request, env);
  }
  
  if (path === '/api/auth/verify' && request.method === 'POST') {
    return verifyMagicLink(request, env);
  }
  
  if (path === '/api/auth/logout' && request.method === 'POST') {
    return logout(request, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

async function requestMagicLink(request, env) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Validate email
    validateEmail(email);
    
    const db = new Database(env.DB);
    
    // Check if email is authorized
    const authorized = await db.isEmailAuthorized(email);
    if (!authorized) {
      // Check environment variable whitelist as fallback
      const authorizedEmails = env.AUTHORIZED_EMAILS?.split(',').map(e => e.trim()) || [];
      if (!authorizedEmails.includes(email)) {
        return new Response(JSON.stringify({ 
          error: 'This email is not authorized to use this service' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Add to database for future
      await db.addAuthorizedEmail(email);
    }
    
    // Generate secure token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');
    
    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Store token in database
    await db.createAuthToken(token, email, expiresAt);
    
    // Send email (mock for now, integrate with email service)
    const magicLink = `${env.FRONTEND_URL}/auth/verify?token=${token}`;
    
    // TODO: Integrate with actual email service
    console.log(`Magic link for ${email}: ${magicLink}`);
    
    // In production, send actual email
    if (env.EMAIL_API_KEY) {
      await sendEmail(env, email, magicLink);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Magic link sent to your email'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send magic link' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function verifyMagicLink(request, env) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      throw new ValidationError('Token is required');
    }
    
    const db = new Database(env.DB);
    
    // Get token from database
    const authToken = await db.getAuthToken(token);
    if (!authToken) {
      throw new AuthError('Invalid or expired token');
    }
    
    // Mark token as used
    await db.markTokenUsed(token);
    
    // Get or create user
    let user = await db.getUserByEmail(authToken.email);
    if (!user) {
      const userId = crypto.randomUUID();
      await db.createUser(userId, authToken.email);
      user = { id: userId, email: authToken.email };
    }
    
    // Create JWT
    const jwt = await createJWT({
      sub: user.id,
      email: user.email
    }, env.JWT_SECRET);
    
    return new Response(JSON.stringify({ 
      success: true,
      token: jwt,
      user: {
        id: user.id,
        email: user.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to verify token' 
    }), {
      status: error.status || 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function logout(request, env) {
  // Since we're using JWTs, we can't invalidate them server-side
  // Client should remove the token
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Logged out successfully'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function sendEmail(env, email, magicLink) {
  // Postmark API integration
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': env.EMAIL_API_KEY || env.POSTMARK_SERVER_TOKEN
    },
    body: JSON.stringify({
      From: env.EMAIL_FROM || 'noreply@qrurl.us',
      To: email,
      Subject: 'Your QRurl Login Link',
      HtmlBody: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login to QRurl</h2>
          <p>Click the link below to log in to your QRurl account:</p>
          <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">
            Log In
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This link expires in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
      TextBody: `Login to QRurl\n\nClick the link below to log in to your QRurl account:\n${magicLink}\n\nThis link expires in 15 minutes. If you didn't request this, please ignore this email.`,
      MessageStream: 'outbound'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Postmark error:', error);
    throw new Error('Failed to send email');
  }
  
  const result = await response.json();
  console.log('Email sent successfully:', result.MessageID);
}