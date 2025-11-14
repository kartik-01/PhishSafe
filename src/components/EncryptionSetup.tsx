import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useEncryption } from '@/contexts/EncryptionContext';
import { toast } from 'sonner';

interface EncryptionSetupProps {
  open: boolean;
  onComplete: () => void;
}

export function EncryptionSetup({ open, onComplete }: EncryptionSetupProps) {
  const { setupEncryption, isLoading } = useEncryption();
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassphrase = (phrase: string): string[] => {
    const errs: string[] = [];
    if (phrase.length < 12) {
      errs.push('Passphrase must be at least 12 characters long');
    }
    if (phrase.length > 128) {
      errs.push('Passphrase must be less than 128 characters');
    }
    if (!/[a-z]/.test(phrase)) {
      errs.push('Passphrase must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(phrase)) {
      errs.push('Passphrase must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(phrase)) {
      errs.push('Passphrase must contain at least one number');
    }
    if (!/[^a-zA-Z0-9]/.test(phrase)) {
      errs.push('Passphrase must contain at least one special character');
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate passphrase
    const passphraseErrors = validatePassphrase(passphrase);
    if (passphraseErrors.length > 0) {
      setErrors(passphraseErrors);
      return;
    }

    // Check if passphrases match
    if (passphrase !== confirmPassphrase) {
      setErrors(['Passphrases do not match']);
      return;
    }

    try {
      await setupEncryption(passphrase);
      toast.success('Encryption setup complete');
      setPassphrase('');
      setConfirmPassphrase('');
      // Don't call onComplete immediately - let the context state update first
      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error: any) {
      console.error('Failed to setup encryption:', error);
      toast.error(error.message || 'Failed to setup encryption');
      setErrors([error.message || 'Failed to setup encryption']);
    }
  };

  const getStrengthColor = () => {
    if (passphrase.length === 0) return 'bg-slate-700';
    const errors = validatePassphrase(passphrase);
    if (errors.length >= 4) return 'bg-red-500';
    if (errors.length >= 2) return 'bg-yellow-500';
    if (errors.length >= 1) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passphrase.length === 0) return '';
    const errors = validatePassphrase(passphrase);
    if (errors.length >= 4) return 'Weak';
    if (errors.length >= 2) return 'Medium';
    if (errors.length >= 1) return 'Strong';
    return 'Very Strong';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-2 border-emerald-500 text-emerald-400 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-50 font-mono flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            Setup Encryption
          </DialogTitle>
          <DialogDescription className="text-slate-300 font-mono text-sm mt-2">
            Create a secure passphrase to encrypt your analysis data. This passphrase cannot be recovered if forgotten.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-mono">
              Encryption Passphrase
            </label>
            <div className="relative">
              <Input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setErrors([]);
                }}
                placeholder="Enter a strong passphrase"
                className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passphrase && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${Math.max(0, 100 - validatePassphrase(passphrase).length * 20)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{getStrengthText()}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2 font-mono">
              Confirm Passphrase
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => {
                  setConfirmPassphrase(e.target.value);
                  setErrors([]);
                }}
                placeholder="Re-enter your passphrase"
                className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <ul className="text-xs text-red-300 space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300 font-mono">
              <strong className="text-yellow-200">Important:</strong> Save this passphrase securely. If you forget it, your encrypted data cannot be recovered.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !passphrase || !confirmPassphrase}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isLoading ? 'Setting up...' : 'Setup Encryption'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

