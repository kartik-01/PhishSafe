#!/bin/bash

# Create .env file with Auth0 configuration
cat > .env << 'EOF'
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-obdvla8zsa5c3jid.us.auth0.com
VITE_AUTH0_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_AUTH0_AUDIENCE=https://api.phishwatch

# API URLs (using mock data by default)
VITE_ML_API_URL=https://api.example.com/v1
VITE_BACKEND_URL=http://localhost:8000

# Mock Mode Settings
# Set to false when your backend is ready
VITE_USE_MOCK_DATA=true
VITE_USE_MOCK_AUTH=false
EOF

echo "✅ .env file created!"
echo "⚠️  Please update VITE_AUTH0_CLIENT_ID with your actual Auth0 Client ID"


