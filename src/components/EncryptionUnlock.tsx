import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useEncryption } from '@/contexts/EncryptionContext';
import { toast } from 'sonner';

interface EncryptionUnlockProps {
  open: boolean;
}

export function EncryptionUnlock({ open }: EncryptionUnlockProps) {
  const { unlockEncryption, isLoading } = useEncryption();
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      console.error('Failed to unlock encryption:', error);
      const errorMessage = error.message || 'Failed to unlock encryption';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-2 border-emerald-500 text-emerald-400 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-slate-50 font-mono flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            Unlock Encryption
          </DialogTitle>
          <DialogDescription className="text-slate-300 font-mono text-sm mt-2">
            Enter your encryption passphrase to access your encrypted data.
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
                  setError('');
                }}
                placeholder="Enter your passphrase"
                className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono pr-10"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !passphrase}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

