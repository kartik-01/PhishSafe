import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Lock } from 'lucide-react';
import DecryptedText from './animations/DecryptedText';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const { loginWithPopup, loginWithRedirect } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    console.log('[AuthModal] handleLogin called');
    console.log('[AuthModal] Auth0 Domain:', import.meta.env.VITE_AUTH0_DOMAIN);
    console.log('[AuthModal] Auth0 Client ID:', import.meta.env.VITE_AUTH0_CLIENT_ID);
    console.log('[AuthModal] Auth0 Audience:', import.meta.env.VITE_AUTH0_AUDIENCE);
    try {
      // Try popup first, fallback to redirect if popup fails
      try {
        console.log('[AuthModal] Attempting popup login...');
        await loginWithPopup({
          authorizationParams: {
            redirect_uri: window.location.origin,
          },
        });
        console.log('[AuthModal] Popup login successful');
        console.log(window.location.origin)
        onClose();
        onAuthSuccess?.();
      } catch (popupError: any) {
        // If popup is blocked or fails, use redirect
        console.warn('[AuthModal] Popup login failed, using redirect:', popupError);
        console.log('[AuthModal] Attempting redirect login...');
        await loginWithRedirect({
          authorizationParams: {
            redirect_uri: window.location.origin,
          },
        });
        console.log('[AuthModal] Redirect login initiated');
      }
    } catch (error) {
      console.error('[AuthModal] Login error:', error);
      alert('Login failed. Please check your Auth0 configuration and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    console.log('[AuthModal] handleSignup called');
    try {
      // Auth0 signup is handled through login with screen_hint
      try {
        console.log('[AuthModal] Attempting popup signup...');
        await loginWithPopup({
          authorizationParams: {
            screen_hint: 'signup',
            redirect_uri: window.location.origin,
          },
        });
        console.log('[AuthModal] Popup signup successful');
        onClose();
        onAuthSuccess?.();
      } catch (popupError: any) {
        // If popup is blocked or fails, use redirect
        console.warn('[AuthModal] Popup signup failed, using redirect:', popupError);
        console.log('[AuthModal] Attempting redirect signup...');
        await loginWithRedirect({
          authorizationParams: {
            screen_hint: 'signup',
            redirect_uri: window.location.origin,
          },
          
        });
        console.log('[AuthModal] Redirect signup initiated');
        console.log(window.location.origin)
      }
    } catch (error) {
      console.error('[AuthModal] Signup error:', error);
      alert('Signup failed. Please check your Auth0 configuration and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-emerald-500 text-emerald-400 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-50 font-mono flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            <DecryptedText text="SECURE ACCESS" speed={50} />
          </DialogTitle>
          <DialogDescription className="text-slate-300 font-mono">
            Login or create an account to save analysis history
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-950/80 border border-emerald-500/30">
            <TabsTrigger value="login" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-slate-100">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-slate-100">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <Button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {loading ? 'Loading...' : 'Login with Auth0'}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <Button 
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {loading ? 'Loading...' : 'Sign Up with Auth0'}
            </Button>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-emerald-400/50 text-center font-mono mt-4">
          Secure authentication powered by Auth0
        </p>
      </DialogContent>
    </Dialog>
  );
}


