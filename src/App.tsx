import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { PhishingChecker } from './components/PhishingChecker';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';

type View = 'landing' | 'checker';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);

  console.log('[App] Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'view:', view);

  // Redirect to checker after login
  useEffect(() => {
    console.log('[App] useEffect triggered - isAuthenticated:', isAuthenticated, 'view:', view);
    if (isAuthenticated && view === 'landing') {
      console.log('[App] Redirecting to checker view');
      setView('checker');
    }
  }, [isAuthenticated, view]);

  const handleStartCheck = () => {
    setView('checker');
  };

  const handleBack = () => {
    setView('landing');
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setView('checker');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-emerald-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'landing' ? (
        <LandingPage 
          onStartCheck={handleStartCheck}
          onAuth={() => setShowAuthModal(true)}
        />
      ) : (
        <PhishingChecker 
          onBack={handleBack}
        />
      )}

      <AuthModal 
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #10b981',
            color: '#10b981',
          },
        }}
      />
    </>
  );
}


