import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { backendService } from '@/services/api';
import { toast } from 'sonner';
import type { Analysis } from '@/types/api';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryDrawer({ open, onOpenChange }: HistoryDrawerProps) {
  const { getAccessTokenSilently } = useAuth();
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
      const token = await getAccessTokenSilently();
      const data = await backendService.getAnalyses(token);
      setAnalyses(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-900 border-emerald-500/30 text-emerald-400 max-h-[80vh]">
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
                  key={analysis._id}
                  className="bg-slate-800/60 border-emerald-500/30 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {analysis.status === 'completed' && analysis.result ? (
                        analysis.result.is_phishing ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-sm text-slate-400 font-mono">
                        {new Date(analysis._id).toLocaleString()}
                      </span>
                    </div>
                    {getStatusBadge(analysis.status)}
                  </div>
                  
                  {analysis.result && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Threat:</span>
                        <Badge
                          className={
                            analysis.result.is_phishing
                              ? 'bg-red-500/20 text-red-400 border-red-500'
                              : 'bg-green-500/20 text-green-400 border-green-500'
                          }
                        >
                          {analysis.result.is_phishing ? 'Phishing' : 'Safe'}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {(analysis.result.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Source: {analysis.result.source}
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


