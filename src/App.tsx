import { useState, useEffect, useLayoutEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { PhishingChecker } from './components/PhishingChecker';
import { AuthModal } from './components/AuthModal';
import { EncryptionSetup } from './components/EncryptionSetup';
import EncryptionUnlock from './components/EncryptionUnlock';
import { useAuth } from './contexts/AuthContext';
import { useEncryption } from './contexts/EncryptionContext';
import { Toaster } from 'sonner';

type View = 'landing' | 'checker';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isSetup, isUnlocked, isLoading: encryptionLoading, hasCompletedInitialCheck } = useEncryption();
  const [view, setView] = useState<View>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);

  // Redirect to checker after login
  useEffect(() => {
    if (isAuthenticated && view === 'landing') {
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

  // Ensure no background element retains focus when EncryptionUnlock appears
  // This must happen synchronously before the dialog applies aria-hidden
  useLayoutEffect(() => {
    if (isSetup && !isUnlocked) {
      // Blur the currently active element first
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement !== document.body) {
        const isInDialog = activeElement.closest('[role="dialog"]');
        if (!isInDialog) {
          activeElement.blur();
        }
      }
      
      // Aggressively blur ALL file inputs (common culprit for aria-hidden warnings)
      const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
      fileInputs.forEach((input) => {
        const isInDialog = input.closest('[role="dialog"]');
        if (!isInDialog) {
          input.blur();
        }
      });
      
      // Also blur all other focusable elements in the background
      // This prevents the aria-hidden warning when dialog opens
      const focusableElements = document.querySelectorAll<HTMLElement>(
        'input:not([type="file"]):not([type="hidden"]), textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusableElements.forEach((el) => {
        // Only blur elements that are not inside a dialog
        const isInDialog = el.closest('[role="dialog"]');
        if (!isInDialog && document.activeElement === el) {
          el.blur();
        }
      });
    }
  }, [isSetup, isUnlocked]);

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

      {isAuthenticated && !encryptionLoading && hasCompletedInitialCheck && (
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


