# Unified Deployment Guide for QRurl

This guide uses a **single Cloudflare Workers service** to serve both the API and frontend, eliminating the need for separate Pages deployment.

## Benefits of Unified Deployment

- ✅ Single service to manage
- ✅ No CORS configuration needed
- ✅ Simpler deployment process
- ✅ Single domain (qrurl.us) for everything
- ✅ Lower complexity

## Prerequisites

1. **Cloudflare Account** with Workers, R2, and D1 enabled
2. **Domain** (qrurl.us) added to Cloudflare
3. **Node.js** and npm installed locally

## Initial Setup

### 1. Create R2 Bucket for Frontend Assets

```bash
# Create bucket for static frontend files
wrangler r2 bucket create qrurl-frontend-assets
```

### 2. Configure Secrets

```bash
# Generate and set JWT secret
openssl rand -base64 32 | wrangler secret put JWT_SECRET --name qrurl-unified

# Set Postmark API key
echo "your-postmark-token" | wrangler secret put EMAIL_API_KEY --name qrurl-unified

# Set authorized emails
echo "email1@example.com,email2@example.com" | wrangler secret put AUTHORIZED_EMAILS --name qrurl-unified
```

### 3. Initialize Database

```bash
# Create database if not exists
wrangler d1 create qrurl-db

# Run migrations
wrangler d1 execute qrurl-db --file=./schema/schema.sql
```

## Deployment Process

### Automatic Deployment

Use the unified deployment script:

```bash
./scripts/deploy-unified.sh
```

This script will:
1. Build the frontend
2. Upload frontend assets to R2
3. Deploy the Workers service

### Manual Deployment

#### 1. Build Frontend
```bash
cd frontend
npm run build --mode=unified
```

#### 2. Upload Frontend to R2
```bash
cd dist
for file in $(find . -type f); do
  wrangler r2 object put qrurl-frontend-assets/${file#./} --file=$file
done
cd ../..
```

#### 3. Deploy Workers
```bash
wrangler deploy --config wrangler.unified.toml
```

## Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages → qrurl-unified
2. Settings → Triggers → Custom Domains
3. Add `qrurl.us` (this will handle both frontend and API)

## URL Structure

With unified deployment, everything runs on the same domain:

- `https://qrurl.us/` - Frontend homepage
- `https://qrurl.us/dashboard` - Dashboard (client-side routing)
- `https://qrurl.us/api/*` - API endpoints
- `https://qrurl.us/abc123` - Short link redirects
- `https://qrurl.us/health` - Health check endpoint

## Environment Variables

The unified deployment uses these environment variables:

```toml
# wrangler.unified.toml
[vars]
BACKEND_URL = "https://qrurl.us"  # No separate frontend URL needed
EMAIL_FROM = "noreply@qrurl.us"
```

## Testing

After deployment, test:

1. **Frontend**: Visit https://qrurl.us
2. **API Health**: https://qrurl.us/health
3. **Authentication**: Request magic link login
4. **Short Links**: Create and test a short link
5. **QR Codes**: Generate QR code with logo

## Rollback

To rollback to a previous version:

```bash
# List deployments
wrangler deployments list --name qrurl-unified

# Rollback to specific version
wrangler rollback --name qrurl-unified --message "Rolling back"
```

## Monitoring

View metrics in Cloudflare Dashboard:
- Workers & Pages → qrurl-unified → Analytics
- R2 → qrurl-frontend-assets (frontend storage)
- R2 → qrurl-storage (logo storage)
- D1 → qrurl-db (database)

## Troubleshooting

### Frontend Not Loading
- Check R2 bucket has frontend files: `wrangler r2 object list qrurl-frontend-assets`
- Verify Workers binding: `FRONTEND_ASSETS` in wrangler.unified.toml

### API Errors
- Check logs: `wrangler tail --name qrurl-unified`
- Verify secrets are set: `wrangler secret list --name qrurl-unified`

### Database Issues
- Check D1 binding in wrangler.unified.toml
- Verify migrations ran: `wrangler d1 execute qrurl-db --command "SELECT * FROM schema_version"`

## Cost Optimization

The unified approach reduces costs:
- Single Workers instance (instead of Workers + Pages)
- R2 storage is very cost-effective for static assets
- No cross-service data transfer fees