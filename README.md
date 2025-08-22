# QRurl - URL Shortener with QR Codes

A modern, serverless URL shortener with QR code generation built on Cloudflare Workers, D1, and R2.

## Features

- 🔗 **Custom Short URLs** - Create memorable short links with custom slugs
- 📱 **QR Code Generation** - Generate QR codes with optional logo embedding
- 🔐 **Magic Link Authentication** - Passwordless login via email
- 📊 **Analytics Dashboard** - Track clicks, geographic data, and referrers
- ⚡ **Edge Performance** - Global low-latency redirects via Cloudflare Workers
- 💾 **Serverless Architecture** - Cost-efficient with automatic scaling

## Tech Stack

### Backend
- **Cloudflare Workers** - Edge compute platform
- **D1 Database** - SQLite-based serverless database
- **R2 Storage** - Object storage for images and QR codes
- **KV Namespace** - Key-value storage for caching

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Vue Router** - Client-side routing
- **Pinia** - State management
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qrurl.git
cd qrurl
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Configure Cloudflare services:
```bash
# Login to Cloudflare
wrangler login

# The D1 database, R2 bucket, and KV namespace are already configured
# Check wrangler.toml for the configuration
```

5. Set up environment variables:
```bash
# Backend (.dev.vars)
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your configuration

# Frontend (frontend/.env)
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed
```

6. Initialize the database:
```bash
# Local database
npm run db:init

# Remote database (production)
npm run db:init:remote
```

### Development

1. Start the backend (Cloudflare Workers):
```bash
npm run dev
# Backend runs on http://localhost:8787
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

3. Open http://localhost:3000 in your browser

### API Endpoints

#### Authentication
- `POST /api/auth/request` - Request magic link
- `POST /api/auth/verify` - Verify magic link token
- `POST /api/auth/logout` - Logout

#### Entries (Protected)
- `GET /api/entries` - List user's entries
- `POST /api/entries` - Create new entry
- `GET /api/entries/:id` - Get entry details
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

#### Analytics (Protected)
- `GET /api/analytics/:id` - Get entry analytics

#### Public
- `GET /health` - Health check
- `GET /:slug` - Redirect to original URL

### Deployment

1. Deploy the backend to Cloudflare Workers:
```bash
npm run deploy
```

2. Build and deploy the frontend:
```bash
cd frontend
npm run build
# Deploy the dist folder to Cloudflare Pages or your preferred hosting
```

### Configuration

#### Email Service
The application uses magic links for authentication. Configure your email service provider in `.dev.vars`:
- Resend: Set `EMAIL_API_KEY` with your Resend API key
- SendGrid: Set `EMAIL_API_KEY` with your SendGrid API key

#### Authorized Emails
Add authorized emails in:
1. Environment variable: `AUTHORIZED_EMAILS` (comma-separated)
2. Database: `authorized_emails` table

## Project Structure

```
qrurl/
├── src/                    # Backend source code
│   ├── index.js           # Main worker entry
│   ├── routes/            # API route handlers
│   ├── middleware/        # Auth, CORS, rate limiting
│   ├── lib/               # Database operations
│   └── utils/             # Utilities
├── frontend/              # Vue.js frontend
│   ├── src/
│   │   ├── views/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── stores/       # Pinia stores
│   │   ├── services/     # API and QR services
│   │   └── router/       # Vue Router config
│   └── public/
├── schema/                # Database schema
├── dev/                   # Development docs
└── wrangler.toml         # Cloudflare Workers config
```

## Security

- JWT-based authentication with secure tokens
- Magic link authentication (passwordless)
- Email whitelist for access control
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## Performance

- Edge deployment for global low latency
- KV caching for frequently accessed data
- Optimized database queries with indexes
- QR code caching in R2
- Lazy loading in frontend

## License

MIT

## Contributing

Pull requests are welcome! Please read the contributing guidelines first.

## Support

For issues and questions, please use the GitHub issues page.