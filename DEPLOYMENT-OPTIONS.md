# QRurl Deployment Options

## Option 1: Unified Service (Recommended) ✅

**Single Cloudflare Workers service** serving both API and frontend.

### Benefits:
- No CORS configuration needed
- Single domain (qrurl.us)
- Simpler deployment
- Lower operational complexity
- Single service to monitor

### Development:
```bash
# Using Foreman
foreman start -f Procfile.unified

# Or using npm scripts
npm run dev:unified
```

### Production Deployment:
```bash
# Automated deployment
./scripts/deploy-unified.sh

# Or manual
npm run deploy:unified
```

### Configuration Files:
- `wrangler.unified.toml` - Production config
- `wrangler.unified.dev.toml` - Development config
- `Procfile.unified` - Foreman config for unified dev

---

## Option 2: Separate Services (Current Setup)

**Cloudflare Workers** for API + **Cloudflare Pages** for frontend.

### Benefits:
- Frontend served from CDN edge (Pages)
- Independent scaling
- Separate deployment cycles
- Traditional architecture

### Development:
```bash
# Using Foreman (default)
foreman start

# Or manually
npm run dev                    # Backend
cd frontend && npm run dev    # Frontend
```

### Production Deployment:
```bash
# Via GitHub Actions (automatic on push to main)
git push origin main

# Or manual
npm run deploy                           # Backend
cd frontend && npm run build && deploy  # Frontend
```

### Configuration Files:
- `wrangler.toml` - Development config
- `wrangler.production.toml` - Production config
- `Procfile` - Foreman config for separate dev

---

## Comparison

| Feature | Unified Service | Separate Services |
|---------|----------------|-------------------|
| **Domains** | 1 (qrurl.us) | 2 (qrurl.us + api.qrurl.us) |
| **CORS** | Not needed | Required |
| **Deployment** | Single command | Two deployments |
| **Complexity** | Lower | Higher |
| **Frontend CDN** | R2 + Workers | Pages CDN |
| **Cost** | Single Workers | Workers + Pages |
| **GitHub Actions** | Simpler | More complex |

---

## Migration Path

### From Separate → Unified:

1. **Deploy unified service:**
   ```bash
   ./scripts/deploy-unified.sh
   ```

2. **Update DNS:**
   - Point `qrurl.us` to Workers service
   - Remove `api.qrurl.us` subdomain

3. **Clean up:**
   - Delete Pages project
   - Remove CORS configuration

### From Unified → Separate:

1. **Deploy frontend to Pages:**
   ```bash
   cd frontend
   npm run build
   wrangler pages deploy dist --project-name qrurl-frontend
   ```

2. **Deploy backend with CORS:**
   ```bash
   wrangler deploy --config wrangler.production.toml
   ```

3. **Update DNS:**
   - Point `qrurl.us` to Pages
   - Add `api.qrurl.us` to Workers

---

## Recommendation

**Use the Unified Service approach** unless you specifically need:
- Separate deployment cycles for frontend/backend
- Different scaling characteristics
- Multi-region frontend CDN (Pages advantage)

The unified approach significantly reduces complexity while maintaining all functionality.