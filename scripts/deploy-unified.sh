#!/bin/bash

# Unified deployment script for single Workers service
# This deploys both API and frontend to a single Workers instance

set -e

echo "======================================"
echo "QRurl Unified Deployment"
echo "======================================"
echo ""

# Build frontend
echo "Building frontend..."
cd frontend
npm run build

# Upload frontend assets to R2
echo ""
echo "Uploading frontend to R2..."
cd dist

# Upload each file to R2 bucket
for file in $(find . -type f); do
  # Remove leading ./ from path
  key=${file#./}
  
  # Determine content type
  case "${file##*.}" in
    html) content_type="text/html" ;;
    js) content_type="application/javascript" ;;
    css) content_type="text/css" ;;
    json) content_type="application/json" ;;
    png) content_type="image/png" ;;
    jpg|jpeg) content_type="image/jpeg" ;;
    svg) content_type="image/svg+xml" ;;
    ico) content_type="image/x-icon" ;;
    woff) content_type="font/woff" ;;
    woff2) content_type="font/woff2" ;;
    *) content_type="application/octet-stream" ;;
  esac
  
  echo "Uploading $key..."
  wrangler r2 object put qrurl-frontend-assets/$key --file=$file --content-type=$content_type
done

cd ../..

# Deploy Workers with unified service
echo ""
echo "Deploying Workers service..."
wrangler deploy --config wrangler.unified.toml

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "Your app is available at:"
echo "- https://qrurl.us (frontend + API)"
echo "- https://qrurl.us/api/* (API endpoints)"
echo "- https://qrurl.us/[slug] (short links)"
echo ""