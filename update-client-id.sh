#!/bin/bash

echo "🔧 Auth0 Client ID Updater"
echo ""
echo "Current Client ID in .env:"
grep "VITE_AUTH0_CLIENT_ID" .env 2>/dev/null || echo "Not found in .env"
echo ""
read -p "Enter your Auth0 Client ID: " client_id

if [ -z "$client_id" ]; then
  echo "❌ Client ID cannot be empty"
  exit 1
fi

# Update .env file
if [ -f .env ]; then
  # Use sed to replace the Client ID
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/VITE_AUTH0_CLIENT_ID=.*/VITE_AUTH0_CLIENT_ID=$client_id/" .env
  else
    # Linux
    sed -i "s/VITE_AUTH0_CLIENT_ID=.*/VITE_AUTH0_CLIENT_ID=$client_id/" .env
  fi
  echo "✅ Updated .env file with Client ID: $client_id"
  echo ""
  echo "⚠️  Please restart your dev server (npm run dev) for changes to take effect"
else
  echo "❌ .env file not found. Please create it first."
fi

