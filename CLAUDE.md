# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QRurl is a serverless URL shortener with QR code generation built as a monorepo with:
- **Backend**: Cloudflare Workers (src/) with D1 database, R2 storage, and KV caching
- **Frontend**: Vue 3 SPA (frontend/) with Tailwind CSS, Pinia, and Vue Router

## Development Commands

### Backend (Cloudflare Workers)
```bash
# Start backend dev server (port 8787)
npm run dev

# Initialize local D1 database
npm run db:init

# Initialize remote D1 database
npm run db:init:remote

# Deploy to Cloudflare Workers
npm run deploy
```

### Frontend (Vue.js)
```bash
cd frontend

# Start frontend dev server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Both Services Running

#### Option 1: Using Foreman
```bash
# Install foreman if not already installed
gem install foreman

# Start both services
foreman start
```

#### Option 2: Manual
Start backend first, then frontend in separate terminals. Frontend proxies API calls to backend via Vite config.

## Architecture & Key Design Patterns

### Backend Architecture
- **Entry Point**: `src/index.js` - Main router handling all requests
- **Custom Router**: `src/router.js` - Lightweight routing implementation
- **Middleware Pipeline**: Applied in order - CORS → Rate Limiting → Auth verification
- **Database Layer**: `src/lib/db.js` - All D1 operations centralized here
- **Auth Flow**: Magic links with JWT tokens, stored in `auth_tokens` table with 15-min expiry

### Frontend Architecture
- **State Management**: Pinia stores (`authStore`, `entriesStore`) handle all API calls
- **API Service**: `src/services/api.js` with axios interceptors for auth
- **QR Generation**: `src/services/qrcode.js` generates QR with optional logo overlay (30% max)
- **Auth Guard**: Router middleware redirects unauthenticated users to login

### CORS Configuration
- Backend middleware in `src/middleware/cors.js` handles preflight
- Frontend Vite proxy in development
- Production requires proper FRONTEND_URL in environment variables

## Cloudflare Resources

All resources use `qrurl-` prefix:
- **D1 Database**: `qrurl-db` (ID: 17eb6fdb-19da-4ed7-931c-a4cdef281f8c)
- **R2 Bucket**: `qrurl-storage`
- **KV Namespace**: `qrurl-cache` (ID: 1cacb0f1b44b4324b62c1bc010ff15f5)

## Environment Configuration

### Backend (.dev.vars)
```
JWT_SECRET=dev-secret-change-in-production
EMAIL_API_KEY=your-resend-or-sendgrid-api-key
AUTHORIZED_EMAILS=test@example.com,admin@example.com
```

### Frontend (frontend/.env)
```
VITE_API_URL=http://localhost:8787/api
VITE_SHORT_URL=http://localhost:8787
```

## Database Schema

Key tables and their relationships:
- `users` → `entries` (one-to-many)
- `entries` → `analytics` (one-to-many)
- `auth_tokens` - temporary magic link tokens
- `authorized_emails` - email whitelist

All tables have proper indexes for performance-critical queries (slug lookups, analytics aggregation).

## Common Issues & Solutions

### CORS Errors
- Check `FRONTEND_URL` in backend environment variables
- Ensure middleware order in `src/middleware/index.js` is correct
- Verify OPTIONS preflight handling in `src/middleware/cors.js`

### Tailwind CSS v4 Issues
Project uses Tailwind CSS v3 (not v4) due to PostCSS compatibility. Don't upgrade without updating PostCSS config.

### Auth Flow
1. Email must be in `authorized_emails` table or `AUTHORIZED_EMAILS` env var
2. Magic link tokens expire in 15 minutes
3. JWT tokens stored in localStorage, expire in 7 days
4. Public endpoints skip auth: `/health`, `/api/auth/*`, redirect paths

## API Response Patterns

All API responses follow:
```javascript
// Success
{ success: true, data: {...} }

// Error
{ error: "Error message" }
```

Protected routes require `Authorization: Bearer <token>` header.