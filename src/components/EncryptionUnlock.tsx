import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Eye, EyeOff, AlertCircle, Clock, Terminal } from 'lucide-react';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimitStatus } from '@/hooks/useRateLimitStatus';
import { toast } from 'sonner';

interface EncryptionUnlockProps {
  open: boolean;
}

interface LogEntry {
  message: string;
  type: 'log' | 'error';
  timestamp: number;
}

function EncryptionUnlock({ open }: EncryptionUnlockProps) {
  const { unlockEncryption, isLoading } = useEncryption();
  const { user, getAccessTokenSilently } = useAuth();
  const { status: rateLimitStatus, checkStatus: checkRateLimitStatus } = useRateLimitStatus(
    user?.sub || null,
    getAccessTokenSilently
  );

  const userSub = user?.sub;

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  // Use layout effect to synchronously manage focus/blur to avoid aria-hidden race
  // This runs BEFORE the dialog applies aria-hidden to background elements
  useLayoutEffect(() => {
    if (!open) {
      // When closing, blur the input to avoid leaving focus on hidden content
      inputRef.current?.blur();
      return;
    }

    // When opening, blur ALL focusable elements in the background FIRST
    // This prevents the aria-hidden warning when Radix applies aria-hidden
    // We do this synchronously before React renders the dialog
    const activeElement = document.activeElement as HTMLElement | null;
    
    // Blur the currently active element if it's not in a dialog
    if (activeElement && activeElement !== document.body) {
      const isInDialog = activeElement.closest('[role="dialog"]');
      if (!isInDialog) {
        activeElement.blur();
      }
    }

    // Aggressively blur ALL file inputs first (they're often the culprit)
    const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fileInputs.forEach((input) => {
      const isInDialog = input.closest('[role="dialog"]');
      if (!isInDialog) {
        input.blur();
        // Force blur by removing focus programmatically
        if (document.activeElement === input) {
          input.blur();
        }
      }
    });

    // Safety check: blur any other focusable elements that might still have focus
    // This handles edge cases where focus might be on a descendant element
    const focusableElements = document.querySelectorAll<HTMLElement>(
      'input:not([type="file"]):not([type="hidden"]), textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach((el) => {
      const isInDialog = el.closest('[role="dialog"]');
      // Only blur if this element currently has focus and is not in a dialog
      if (!isInDialog && document.activeElement === el) {
        el.blur();
      }
    });
  }, [open]);

  // Handle focus when dialog opens - use Radix's onOpenAutoFocus for proper timing
  // We prevent default to control when focus happens (after aria-hidden is removed)
  const handleOpenAutoFocus = (e: Event) => {
    // Prevent default focus behavior
    e.preventDefault();
    
    // Wait for dialog animation to complete (200ms) plus buffer
    // This ensures aria-hidden is removed before we focus
    setTimeout(() => {
      if (inputRef.current && open) {
        inputRef.current.focus();
      }
    }, 250);
  };

  // Update countdown when status changes
  useEffect(() => {
    setCountdown(rateLimitStatus.remainingSeconds);
  }, [rateLimitStatus.remainingSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!rateLimitStatus.isLocked || !rateLimitStatus.lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, (rateLimitStatus.lockedUntil || 0) - Date.now());
      if (remaining <= 0) {
        setCountdown(0);
        // Refresh status when lockout expires
        checkRateLimitStatus();
      } else {
        setCountdown(Math.ceil(remaining / 1000));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [rateLimitStatus.isLocked, rateLimitStatus.lockedUntil, checkRateLimitStatus]);

  // Update error state based on rate limit status
  useEffect(() => {
    if (rateLimitStatus.isLocked) {
      setError(`Account is locked. Try again in ${rateLimitStatus.remainingSeconds} seconds.`);
    } else if (rateLimitStatus.attempts > 0 && rateLimitStatus.attempts < 5) {
      const remaining = 5 - rateLimitStatus.attempts;
      setError(`Invalid passphrase. Please try again. (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`);
    } else {
      setError('');
    }
  }, [rateLimitStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([]);

    if (rateLimitStatus.isLocked) {
      setError(
        `Account is locked. Try again in ${rateLimitStatus.remainingSeconds} seconds.`
      );
      return;
    }

    if (!passphrase) {
      setError('Please enter your passphrase');
      return;
    }

    try {
      await unlockEncryption(passphrase);
      toast.success('Encryption unlocked');
      setPassphrase('');
      setError('');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to unlock encryption';
      setError(errorMessage);
      // Refresh rate limit status after failed attempt
      checkRateLimitStatus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        ref={dialogRef as any} 
        className="bg-slate-900 border-2 border-emerald-500 text-emerald-400 sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-50 font-mono flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            Unlock Encryption
          </DialogTitle>
          <DialogDescription className="text-slate-300 font-mono text-sm mt-2">
            Enter your encryption passphrase to access your encrypted data.
          </DialogDescription>
        </DialogHeader>

        {rateLimitStatus.isLocked ? (
          <div className="bg-red-950/40 border border-red-500/60 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-red-200 font-bold text-lg">
                🔒 Account Locked
              </span>
            </div>
            <div className="text-4xl font-mono text-red-400 font-bold">
              {countdown}s
            </div>
            <p className="text-red-300 text-sm">
              Too many failed unlock attempts. Please wait before trying again.
            </p>
            <div className="w-full bg-red-950/50 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, (countdown / 300) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-yellow-950/50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="text-yellow-200">
                    <p className="font-bold text-base mb-1">⚠️ Warning: Authentication Failed</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-mono">
                Encryption Passphrase
              </label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="Enter your passphrase"
                  className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono pr-10"
                  disabled={isLoading}
                  // controlled focus via useLayoutEffect to avoid aria-hidden race
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassphrase ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passphrase}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isLoading ? 'Unlocking...' : 'Unlock'}
            </Button>
          </form>
          </>
        )}

        {/* Real-time logs */}
        {logs.length > 0 && (
          <div className="bg-slate-800/60 border border-emerald-500/30 rounded-lg overflow-hidden mt-6">
            <div className="px-3 py-2 bg-slate-800 border-b border-emerald-500/20 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-400 text-xs font-mono font-semibold">
                Debug Logs
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto p-3 space-y-1 font-mono text-xs">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.message.includes('✓')
                      ? 'text-green-400'
                      : 'text-emerald-400'
                  } break-words`}
                >
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

  );
}

export default EncryptionUnlock;


