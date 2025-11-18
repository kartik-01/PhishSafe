import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './contexts/AuthContext';
import { EncryptionProvider } from './contexts/EncryptionContext';
import App from './App';
import './index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience!
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={() => {
        // Auth0 SDK processes the callback automatically
        // Clean up URL after Auth0 has processed it
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('code') || urlParams.has('state')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }, 1000);
      }}
    >
      <AuthProvider>
        <EncryptionProvider>
          <App />
        </EncryptionProvider>
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>
);

