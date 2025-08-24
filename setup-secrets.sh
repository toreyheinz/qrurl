#!/bin/bash

# Production secrets setup script
# Run this once to configure production secrets

echo "Setting up Cloudflare Workers secrets for production..."

# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET"

# Prompt for email API key
read -p "Enter your Postmark Server API Token: " EMAIL_API_KEY

# Prompt for email from address
read -p "Enter the FROM email address (e.g., noreply@qrurl.us): " EMAIL_FROM

# Prompt for authorized emails
read -p "Enter authorized emails (comma-separated): " AUTHORIZED_EMAILS

# Set the secrets
echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
echo "$EMAIL_API_KEY" | npx wrangler secret put EMAIL_API_KEY  
echo "$EMAIL_FROM" | npx wrangler secret put EMAIL_FROM
echo "$AUTHORIZED_EMAILS" | npx wrangler secret put AUTHORIZED_EMAILS

echo "✅ Secrets configured successfully!"
echo ""
echo "Next steps:"
echo "1. Add GitHub secrets (CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID)"
echo "2. Configure custom domains in Cloudflare dashboard"
echo "3. Push to main branch to trigger deployment"