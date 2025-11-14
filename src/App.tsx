import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { PhishingChecker } from './components/PhishingChecker';
import { AuthModal } from './components/AuthModal';
import { EncryptionSetup } from './components/EncryptionSetup';
import { EncryptionUnlock } from './components/EncryptionUnlock';
import { useAuth } from './contexts/AuthContext';
import { useEncryption } from './contexts/EncryptionContext';
import { Toaster } from 'sonner';

type View = 'landing' | 'checker';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isSetup, isUnlocked, isLoading: encryptionLoading } = useEncryption();
  const [view, setView] = useState<View>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);

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

  // Show encryption setup if authenticated but not setup (only when on checker view)
  useEffect(() => {
    if (isAuthenticated && !encryptionLoading && !isSetup && view === 'checker' && !isUnlocked) {
      setShowEncryptionSetup(true);
    } else {
      // If encryption is setup OR unlocked, don't show setup modal
      if (isSetup || isUnlocked) {
        setShowEncryptionSetup(false);
      }
    }
  }, [isAuthenticated, encryptionLoading, isSetup, isUnlocked, view]);

  if (isLoading || encryptionLoading) {
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

      {isAuthenticated && (
        <>
          <EncryptionSetup
            open={showEncryptionSetup}
            onComplete={() => setShowEncryptionSetup(false)}
          />
          <EncryptionUnlock
            open={isSetup && !isUnlocked}
          />
        </>
      )}

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


