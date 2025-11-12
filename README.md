# PhishSafe

Intelligent Email Protection System built with React, TypeScript, Tailwind CSS, and Vite.

## Features

- **URL Scanner**: Analyze suspicious URLs for phishing indicators
- **Email Analysis**: Parse .eml files and detect malicious headers
- **AI-Powered Detection**: Real-time threat assessment with confidence scores
- **Authentication**: Secure login/signup with Auth0
- **Analysis History**: View past analyses (authenticated users only)
- **Guest Mode**: Instant analysis without authentication

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Auth0
- Radix UI Components
- Motion (animations)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Set up environment variables**:

   **Option A: Quick setup (recommended)**
   ```bash
   ./setup-env.sh
   ```
   Then edit `.env` and add your Auth0 Client ID.

   **Option B: Manual setup**
   Create a `.env` file in the root directory:
   ```env
   # Auth0 Configuration (already configured)
   VITE_AUTH0_DOMAIN=dev-obdvla8zsa5c3jid.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id-here
   VITE_AUTH0_AUDIENCE=https://api.phishwatch

   # API URLs (using mock data by default)
   VITE_ML_API_URL=https://api.example.com/v1
   VITE_BACKEND_URL=http://localhost:8000

   # Mock mode (default: true if APIs not configured)
   VITE_USE_MOCK_DATA=true
   VITE_USE_MOCK_AUTH=false
   ```

   **Get your Auth0 Client ID:**
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Applications → Your Application → Copy Client ID
   - Add it to `.env` file

   See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

   **Note**: The app works with **mock data mode** for API testing, but you need Auth0 Client ID for authentication.

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── animations/     # Animation components (LetterGlitch, DecryptedText, etc.)
│   ├── ui/             # Reusable UI components
│   ├── LandingPage.tsx
│   ├── PhishingChecker.tsx
│   ├── AuthModal.tsx
│   └── HistoryDrawer.tsx
├── contexts/
│   └── AuthContext.tsx # Auth0 context wrapper
├── services/
│   └── api.ts          # API service layer
├── types/
│   └── api.ts          # TypeScript type definitions
├── App.tsx
└── main.tsx
```

## API Integration

The app integrates with two backend services:

1. **ML Model API** (`VITE_ML_API_URL`): Provides phishing detection predictions
2. **PhishWatch Backend** (`VITE_BACKEND_URL`): Stores analysis history for authenticated users

See `reference/phishsafe.txt` for detailed API contracts.

## Environment Variables

- `VITE_AUTH0_DOMAIN`: Your Auth0 domain (optional for mock mode)
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID (optional for mock mode)
- `VITE_AUTH0_AUDIENCE`: Your Auth0 API audience (optional for mock mode)
- `VITE_ML_API_URL`: ML Model API base URL (optional for mock mode)
- `VITE_BACKEND_URL`: PhishWatch Backend base URL (optional for mock mode)
- `VITE_USE_MOCK_DATA`: Set to `true` to use mock API responses (default: `true` if APIs not configured)
- `VITE_USE_MOCK_AUTH`: Set to `true` to use mock authentication (default: `true` if Auth0 not configured)

## Testing

The app includes **mock data mode** for testing without backend deployment. See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions.

### Quick Test:
1. Run `npm run dev`
2. Click "Start Guest Analysis"
3. Test URL scanning or email analysis
4. Try the phishing examples from the testing guide

## Switching to Real APIs

When your backend is ready:
1. Set `VITE_USE_MOCK_DATA=false` in `.env`
2. Add your API URLs and Auth0 credentials
3. Restart the dev server

## License

MIT

