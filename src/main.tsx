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

console.log('[main.tsx] Auth0 Configuration:');
console.log('  Domain:', domain);
console.log('  Client ID:', clientId);
console.log('  Audience:', audience);

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
      onRedirectCallback={(appState) => {
        console.log('[Auth0Provider] Redirect callback triggered, appState:', appState);
        console.log(window.location.origin)
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

