import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { backendService } from '@/services/api';
import { toast } from 'sonner';
import type { Analysis, EncryptedAnalysis } from '@/types/api';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

export function HistoryDrawer({ open, onOpenChange, triggerRef }: HistoryDrawerProps) {
    // Focus management for accessibility
    const drawerContentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (open) {
        const el = drawerContentRef.current;
        if (el) {
          const focusable = el.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          // blur any active element first to avoid hiding focus from AT
          (document.activeElement as HTMLElement | null)?.blur?.();
          focusable?.focus();
        }
      } else if (triggerRef?.current) {
        // Restore focus to the trigger button synchronously
        triggerRef.current?.focus();
      }
    }, [open, triggerRef]);
  const { getAccessTokenSilently } = useAuth();
  const { decryptData, isUnlocked } = useEncryption();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (!isUnlocked) {
        toast.error('Encryption not unlocked. Please unlock encryption to view history.');
        return;
      }

      const token = await getAccessTokenSilently();
      const response = await backendService.getAnalyses(token);
      
      // Decrypt each analysis
      const decryptedAnalyses = await Promise.all(
        response.items.map(async (encrypted: EncryptedAnalysis) => {
          try {
            return await decryptData(encrypted);
          } catch (error) {
            console.error('Failed to decrypt analysis:', error);
            // Return a placeholder if decryption fails
            return {
              id: encrypted.id,
              userSub: encrypted.userSub,
              userEmail: '[Encrypted]',
              inputType: encrypted.inputType,
              inputContent: '[Decryption failed]',
              mlResult: {
                is_phishing: false,
                phishing_probability: 0,
              },
              createdAt: encrypted.createdAt,
              updatedAt: encrypted.updatedAt,
            } as Analysis;
          }
        })
      );
      
      setAnalyses(decryptedAnalyses);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent ref={drawerContentRef} className="bg-slate-900 border-emerald-500/30 text-emerald-400 max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="text-2xl text-slate-50 font-mono">Analysis History</DrawerTitle>
          <DrawerDescription className="text-slate-300 font-mono">
            View your past phishing analyses
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-mono">
              No analysis history found
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="bg-slate-800/60 border-emerald-500/30 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {analysis.mlResult ? (
                        analysis.mlResult.is_phishing ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-sm text-slate-400 font-mono">
                        {new Date(analysis.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500">
                      {analysis.inputType.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {analysis.mlResult && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Threat:</span>
                        <Badge
                          className={
                            analysis.mlResult.is_phishing
                              ? 'bg-red-500/20 text-red-400 border-red-500'
                              : 'bg-green-500/20 text-green-400 border-green-500'
                          }
                        >
                          {analysis.mlResult.is_phishing ? 'Phishing' : 'Safe'}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {(analysis.mlResult.phishing_probability * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}


