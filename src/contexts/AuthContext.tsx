import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface LoginOptions {
  authorizationParams?: {
    redirect_uri?: string;
    screen_hint?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  loginWithRedirect: (options?: LoginOptions) => Promise<void>;
  loginWithPopup: (options?: LoginOptions) => Promise<void>;
  logout: () => void;
  getAccessTokenSilently: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth0 = useAuth0();

  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    loginWithPopup,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = auth0;

  const logout = () => {
    // Clear stored token on logout, then redirect via Auth0
    try {
      sessionStorage.removeItem('phishsafe_token');
    } catch (e) {
      // ignore
    }

    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  // When the user becomes authenticated, fetch an access token and store it in sessionStorage.
  // This allows other parts of the app (or non-React scripts) to read the token if needed.
  useEffect(() => {
    let mounted = true;
    const storeToken = async () => {
      console.log('[AuthContext] Auth state changed - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
      
      if (isAuthenticated) {
        console.log('[AuthContext] User is authenticated, fetching token...');
        try {
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            },
        });
        console.log(token);
          if (!mounted) return;
          console.log('[AuthContext] Token retrieved successfully:', token?.substring(0, 20) + '...');
          try {
            sessionStorage.setItem('phishsafe_token', token);
            console.log('[AuthContext] Token stored in sessionStorage');
            console.log('authparams',window.location.origin)
            // Also log what's in storage to verify
            const stored = sessionStorage.getItem('phishsafe_token');
            console.log('[AuthContext] Verified token in sessionStorage:', stored?.substring(0, 20) + '...');
          } catch (e) {
            console.error('[AuthContext] Failed to store token in sessionStorage:', e);
          }
        } catch (e) {
          console.error('[AuthContext] Failed to get token:', e);
          // token retrieval failed; ensure no stale token remains
          try { sessionStorage.removeItem('phishsafe_token'); } catch (err) {}
        }
      } else {
        console.log('[AuthContext] User is not authenticated, clearing token');
        try { sessionStorage.removeItem('phishsafe_token'); } catch (err) {}
      }
    };

    storeToken();
    return () => { mounted = false };
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        loginWithRedirect,
        loginWithPopup,
        logout,
        getAccessTokenSilently,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
