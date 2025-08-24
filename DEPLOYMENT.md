# Deployment Guide for qrurl.us

## Prerequisites

1. **Cloudflare Account** with:
   - Workers subscription (free tier works)
   - R2 enabled
   - Pages enabled
   - Domain `qrurl.us` added to Cloudflare

2. **GitHub Repository**: https://github.com/toreyheinz/qrurl

## Setup Steps

### 1. Configure Cloudflare API Token

Create a Cloudflare API token with these permissions:
- Account: Cloudflare Workers Scripts:Edit
- Account: Cloudflare Pages:Edit
- Account: D1:Edit
- Account: Workers R2 Storage:Edit
- Account: Workers KV Storage:Edit
- Zone: DNS:Edit (for qrurl.us)

### 2. Add GitHub Secrets

Go to GitHub repo → Settings → Secrets → Actions and add:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: b253e6fbfd2f7757cadd0386de5bde3f

### 3. Configure Cloudflare Environment

#### Workers Secrets (via Dashboard or CLI):
```bash
# Set production secrets
npx wrangler secret put JWT_SECRET --env production
npx wrangler secret put EMAIL_API_KEY --env production
npx wrangler secret put AUTHORIZED_EMAILS --env production
```

#### Initialize Production Database:
```bash
# Run database migrations on production
npm run db:init:remote
```

### 4. Set Up Custom Domains

#### For API (Workers):
1. Go to Cloudflare Dashboard → Workers & Pages → qrurl
2. Settings → Triggers → Custom Domains
3. Add: `api.qrurl.us`

#### For Frontend (Pages):
1. Go to Cloudflare Dashboard → Workers & Pages → qrurl-frontend
2. Custom domains → Add domain
3. Add: `qrurl.us` and `www.qrurl.us`

### 5. Create Cloudflare Pages Project

```bash
# One-time setup for Pages project
npx wrangler pages project create qrurl-frontend --production-branch main
```

### 6. DNS Configuration

Add these DNS records in Cloudflare:

```
Type  Name    Content
A     @       192.0.2.1        (Proxied - placeholder for Pages)
CNAME www     qrurl.us         (Proxied)
CNAME api     qrurl.workers.dev (Proxied - or use Workers custom domain)
```

## Deployment Process

### Automatic Deployment

Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

This will:
1. Deploy backend to Cloudflare Workers
2. Build and deploy frontend to Cloudflare Pages
3. Update both production environments

### Manual Deployment

#### Backend:
```bash
npm run deploy
```

#### Frontend:
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name qrurl-frontend
```

## Environment Variables

### Backend (Workers):
- `JWT_SECRET`: Strong random secret for JWT signing
- `EMAIL_API_KEY`: Resend or SendGrid API key
- `AUTHORIZED_EMAILS`: Comma-separated list of authorized emails
- `FRONTEND_URL`: https://qrurl.us
- `BACKEND_URL`: https://qrurl.us

### Frontend (Build-time):
- `VITE_API_URL`: https://api.qrurl.us/api
- `VITE_SHORT_URL`: https://qrurl.us

## Post-Deployment Checklist

- [ ] Verify Workers deployment at https://api.qrurl.us/health
- [ ] Verify Pages deployment at https://qrurl.us
- [ ] Test authentication flow
- [ ] Test URL creation and redirection
- [ ] Test logo upload to R2
- [ ] Verify QR code generation with logos
- [ ] Check analytics tracking
- [ ] Test rate limiting

## Monitoring

- **Workers Analytics**: Cloudflare Dashboard → Workers & Pages → qrurl → Analytics
- **Pages Analytics**: Cloudflare Dashboard → Workers & Pages → qrurl-frontend → Analytics
- **R2 Storage**: Cloudflare Dashboard → R2 → qrurl-storage
- **D1 Database**: Cloudflare Dashboard → D1 → qrurl-db

## Rollback

If issues occur:

1. **Workers**: Deploy previous version via dashboard or:
   ```bash
   npx wrangler rollback
   ```

2. **Pages**: Rollback via dashboard to previous deployment

## Troubleshooting

### CORS Issues
- Verify `FRONTEND_URL` is set correctly in Workers environment
- Check custom domain configuration

### Database Issues
- Ensure D1 database ID matches in wrangler.toml
- Run migrations: `npm run db:init:remote`

### R2 Issues
- Verify R2 bucket exists: `qrurl-storage`
- Check bucket permissions

### Domain Issues
- Ensure DNS records are proxied through Cloudflare
- Wait for DNS propagation (up to 48 hours)