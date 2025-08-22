# Feature Plan: QRurl MVP Implementation

**Status**: Planning
**Created**: 2025-08-22
**Author**: Claude

## Overview
Building a serverless URL shortener with QR code generation capabilities using Cloudflare Workers, D1 database, and R2 storage. The MVP will include magic link authentication, custom branded QR codes, basic analytics, and a simple management interface.

## Requirements
- URL shortening with custom slugs
- QR code generation with logo embedding
- Magic link authentication (passwordless)
- Email whitelist for access control
- Basic analytics tracking (clicks, referrers, geographic data)
- Admin interface for managing links
- Serverless deployment on Cloudflare Workers

## Technical Approach
Leverage Cloudflare's edge infrastructure for global low-latency redirects. Use D1 for data persistence, R2 for image/QR storage, and Workers for all compute. Frontend will be a SPA served from Workers or Pages.

### Architecture Decisions
- **Cloudflare Workers**: Chosen for edge performance and cost-efficiency
- **D1 Database**: SQLite-based, perfect for read-heavy workloads
- **R2 Storage**: Cost-effective object storage for QR codes and logos
- **Magic Links**: Simpler than password management, better UX
- **QR with High Error Correction**: Allows 30% obstruction for logo overlay

## Implementation Tasks

### Phase 1: Foundation (Week 1)
- [ ] Initialize Cloudflare Workers project with Wrangler
- [ ] Set up development environment and local testing
- [ ] Create D1 database and implement schema
- [ ] Configure R2 bucket for storage
- [ ] Set up basic routing structure
- [ ] Implement health check endpoint
- [ ] Configure environment variables and secrets

### Phase 2: Core URL Functionality (Week 1-2)
- [ ] Implement slug generation (nanoid with custom alphabet)
- [ ] Create URL entry CRUD operations
- [ ] Build redirect handler with analytics capture
- [ ] Add URL validation and sanitization
- [ ] Implement slug collision handling
- [ ] Create basic rate limiting
- [ ] Write unit tests for URL operations

### Phase 3: Authentication System (Week 2)
- [ ] Design magic link token generation
- [ ] Create email whitelist management
- [ ] Implement token storage with expiry (15 min)
- [ ] Build email sending integration (Resend/SendGrid)
- [ ] Create JWT session management
- [ ] Add authentication middleware
- [ ] Implement logout functionality
- [ ] Write auth system tests

### Phase 4: QR Code Generation (Week 3)
- [ ] Research and select QR library for Workers
- [ ] Implement basic QR code generation
- [ ] Add logo overlay functionality (max 30% area)
- [ ] Create QR caching strategy in R2
- [ ] Build image upload and processing
- [ ] Implement logo resizing (128x128 standard)
- [ ] Add QR customization options (colors, margins)
- [ ] Test QR scanning reliability with logos

### Phase 5: Analytics & Tracking (Week 3-4)
- [ ] Design analytics data model
- [ ] Implement click tracking
- [ ] Add geographic detection via CF headers
- [ ] Create user agent parsing
- [ ] Build referrer tracking
- [ ] Implement analytics aggregation
- [ ] Add batch write optimization
- [ ] Create analytics API endpoints

### Phase 6: Frontend Interface (Week 4-5)
- [ ] Set up frontend framework (React/Vue)
- [ ] Create authentication flow UI
- [ ] Build link management dashboard
- [ ] Implement QR code preview
- [ ] Add analytics visualization
- [ ] Create link creation form
- [ ] Build responsive mobile interface
- [ ] Add dark mode support

### Phase 7: Polish & Optimization (Week 5-6)
- [ ] Implement comprehensive error handling
- [ ] Add input validation across all endpoints
- [ ] Set up monitoring and alerting
- [ ] Optimize database queries
- [ ] Implement caching strategy
- [ ] Add security headers
- [ ] Create API documentation
- [ ] Write deployment scripts

## Files to Create/Modify

### Project Structure
```
/
├── wrangler.toml              # Workers configuration
├── package.json               # Dependencies
├── src/
│   ├── index.js              # Main worker entry
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── api.js            # API routes
│   │   └── redirect.js       # Redirect handler
│   ├── lib/
│   │   ├── db.js             # Database operations
│   │   ├── qr.js             # QR generation
│   │   ├── email.js          # Email service
│   │   └── analytics.js      # Analytics tracking
│   ├── middleware/
│   │   ├── auth.js           # Auth middleware
│   │   └── rateLimit.js      # Rate limiting
│   └── utils/
│       ├── slug.js           # Slug generation
│       └── validation.js     # Input validation
├── schema/
│   └── schema.sql            # D1 database schema
├── frontend/
│   ├── src/                 # Frontend application
│   └── public/               # Static assets
└── tests/
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

## Testing Strategy

### Unit Tests
- Slug generation uniqueness and format
- URL validation and sanitization
- Token generation and expiry
- QR code generation with various inputs
- Analytics data aggregation

### Integration Tests
- Full authentication flow
- URL creation → redirect → analytics
- QR generation with logo upload
- Rate limiting behavior
- Email delivery

### Performance Tests
- Redirect latency under load
- QR generation performance
- Database query optimization
- Concurrent user handling

## Edge Cases & Error Handling
- **Duplicate slugs**: Retry with different random slug or return error
- **Invalid URLs**: Validate protocol, prevent javascript: and data: URIs
- **Large logo files**: Resize before storage, reject if > 5MB
- **Email delivery failure**: Queue for retry, provide alternate auth method
- **Rate limit exceeded**: Return 429 with retry-after header
- **Database connection issues**: Implement circuit breaker pattern
- **QR generation timeout**: Pre-generate and cache popular QRs

## Security Considerations
- Input sanitization for all user inputs
- CSRF protection on state-changing operations
- Secure random token generation (crypto.getRandomValues)
- Content Security Policy headers
- SQL injection prevention via parameterized queries
- XSS prevention in frontend
- Rate limiting per IP and per user
- Secure cookie settings (httpOnly, secure, sameSite)

## Performance Targets
- Redirect latency: < 50ms globally
- QR generation: < 500ms with logo
- API response time: < 200ms
- Time to interactive (frontend): < 2s
- Database queries: < 10ms for reads

## Cost Estimation
- Workers: ~$5/month (10M requests)
- D1: Free tier (5GB, 500M reads)
- R2: Free tier (10GB storage)
- Email service: ~$10/month (Resend starter)
- **Total**: ~$15/month for moderate usage

## Open Questions
- [ ] Should we support custom domains for branded short links?
- [ ] How should we handle GDPR/privacy for analytics?
- [ ] Should QR codes support dynamic content updates?
- [ ] Do we need bulk import/export functionality?
- [ ] Should we add team/organization support later?

## Future Considerations
- Custom domain support for enterprise users
- API access for programmatic link creation
- Webhook support for analytics events
- A/B testing for destination URLs
- Link expiration and scheduling
- Password-protected links
- Browser extension for quick shortening
- Mobile app for QR scanning and management

## Documentation Plan
After implementation, create `dev/docs/20250822-qrurl-mvp.md` with:
- System architecture overview
- API documentation with examples
- Deployment guide
- Configuration options
- Troubleshooting common issues
- Performance tuning guide
- Security best practices

## Success Metrics
- Successfully deploy to production
- Handle 1000+ redirects/day without issues
- Generate QR codes with logos that scan reliably
- Achieve < 50ms redirect latency globally
- Pass security audit
- Complete implementation within 6 weeks

## Next Steps
1. Review and approve this plan
2. Set up Cloudflare account and services
3. Initialize project repository
4. Begin Phase 1 implementation
5. Set up CI/CD pipeline