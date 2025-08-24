#!/bin/bash

# Production Setup Helper Script
# This script helps configure the remaining deployment settings

echo "======================================"
echo "QRurl Production Setup Helper"
echo "======================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI found"
echo ""

# Check if logged in to Cloudflare
echo "Checking Cloudflare authentication..."
wrangler whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "📝 Please log in to Cloudflare:"
    wrangler login
fi

echo ""
echo "======================================"
echo "Step 1: GitHub Secrets Configuration"
echo "======================================"
echo ""
echo "Add these secrets to your GitHub repository:"
echo "https://github.com/toreyheinz/qrurl/settings/secrets/actions"
echo ""
echo "1. CLOUDFLARE_API_TOKEN"
echo "   Create at: https://dash.cloudflare.com/profile/api-tokens"
echo "   Required permissions:"
echo "   - Account: Cloudflare Workers Scripts:Edit"
echo "   - Account: Cloudflare Pages:Edit"
echo "   - Account: D1:Edit"
echo "   - Account: Workers R2 Storage:Edit"
echo "   - Account: Workers KV Storage:Edit"
echo "   - Zone: DNS:Edit (for qrurl.us)"
echo ""
echo "2. CLOUDFLARE_ACCOUNT_ID: b253e6fbfd2f7757cadd0386de5bde3f"
echo ""
read -p "Press Enter when you've added the GitHub secrets..."

echo ""
echo "======================================"
echo "Step 2: Production Secrets"
echo "======================================"
echo ""
echo "Setting up Cloudflare Workers secrets..."

# Generate JWT secret if not provided
read -p "Enter JWT_SECRET (or press Enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

# Get email API key
read -p "Enter Postmark Server API Token: " EMAIL_API_KEY

# Get email from address
read -p "Enter FROM email address (e.g., noreply@qrurl.us): " EMAIL_FROM

# Get authorized emails
read -p "Enter AUTHORIZED_EMAILS (comma-separated): " AUTHORIZED_EMAILS

echo ""
echo "Setting production secrets..."
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --name qrurl
echo "$EMAIL_API_KEY" | wrangler secret put EMAIL_API_KEY --name qrurl
echo "$EMAIL_FROM" | wrangler secret put EMAIL_FROM --name qrurl
echo "$AUTHORIZED_EMAILS" | wrangler secret put AUTHORIZED_EMAILS --name qrurl

echo ""
echo "======================================"
echo "Step 3: Initialize Production Database"
echo "======================================"
echo ""
echo "Running database migrations..."
npm run db:init:remote

echo ""
echo "======================================"
echo "Step 4: Deploy to Production"
echo "======================================"
echo ""
echo "Deploying backend to Cloudflare Workers..."
npm run deploy

echo ""
echo "Building and deploying frontend to Cloudflare Pages..."
cd frontend
npm run build
wrangler pages deploy dist --project-name qrurl-frontend --branch main

cd ..

echo ""
echo "======================================"
echo "✅ Production Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure custom domains in Cloudflare Dashboard:"
echo "   - Workers: Add api.qrurl.us as custom domain"
echo "   - Pages: Add qrurl.us and www.qrurl.us as custom domains"
echo ""
echo "2. Verify deployment:"
echo "   - API: https://api.qrurl.us/health"
echo "   - Frontend: https://qrurl.us"
echo ""
echo "3. Future deployments will happen automatically when you push to main branch"
echo ""
echo "For more details, see DEPLOYMENT.md"