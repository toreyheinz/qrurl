export function handleError(error) {
  console.error('Error:', error);

  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  return new Response(JSON.stringify({
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}