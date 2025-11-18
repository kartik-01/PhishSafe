import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Clock, Loader2, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
            // Failed to decrypt analysis
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


  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };


  const parseEmailHeaders = (content: string) => {
    const headers: Record<string, string> = {};
    const lines = content.split('\n');
    let currentHeader = '';
    let currentValue = '';
    let headerEnded = false;

    for (const line of lines) {
      if (headerEnded) break;
      
      // Check if line starts a new header (contains colon and not indented)
      if (line.includes(':') && !line.match(/^\s/)) {
        // Save previous header
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.trim();
        }
        // Start new header
        const [header, ...valueParts] = line.split(':');
        currentHeader = header.trim();
        currentValue = valueParts.join(':').trim();
      } else if (currentHeader && (line.match(/^\s/) || line.match(/^\t/))) {
        // Continuation of previous header (indented)
        currentValue += ' ' + line.trim();
      } else if (line.trim() === '') {
        // Empty line marks end of headers
        if (currentHeader) {
          headers[currentHeader.toLowerCase()] = currentValue.trim();
          currentHeader = '';
          currentValue = '';
        }
        headerEnded = true;
      } else if (currentHeader) {
        // Save current header if we hit non-header content
        headers[currentHeader.toLowerCase()] = currentValue.trim();
        currentHeader = '';
        currentValue = '';
      }
    }

    // Save last header
    if (currentHeader) {
      headers[currentHeader.toLowerCase()] = currentValue.trim();
    }

    // Extract SPF info
    const receivedSpf = headers['received-spf'] || '';
    const spfMatch = receivedSpf.match(/spf=(\w+)/);
    const spf = spfMatch ? spfMatch[1] : 'NONE';
    const ipMatch = receivedSpf.match(/ip4=([\d.]+)/) || headers['received']?.match(/\[([\d.]+)\]/);
    const spfIp = ipMatch ? ipMatch[1] : '0.0.0.0';

    // Parse date and calculate delivery time if available
    const dateHeader = headers['date'] || headers['received']?.split(';')[0] || '';
    let formattedDate = 'N/A';
    let deliveryTime = '';
    
    if (dateHeader && dateHeader !== 'N/A') {
      try {
        const date = new Date(dateHeader);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          
          // Try to extract delivery time from Received headers
          const receivedHeaders = Object.keys(headers)
            .filter(k => k.startsWith('received'))
            .map(k => headers[k]);
          
          for (const received of receivedHeaders) {
            const timeMatch = received.match(/(\d+)\s+seconds?/i);
            if (timeMatch) {
              deliveryTime = ` (Delivered after ${timeMatch[1]} seconds)`;
              break;
            }
          }
        }
      } catch (e) {
        formattedDate = dateHeader;
      }
    }

    return {
      messageId: headers['message-id'] || headers['messageid'] || 'N/A',
      date: formattedDate + deliveryTime,
      from: headers['from'] || 'N/A',
      to: headers['to'] || headers['delivered-to'] || 'N/A',
      subject: headers['subject'] || 'N/A',
      spf,
      spfIp,
    };
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        ref={drawerContentRef} 
        className="border-emerald-500/30 text-emerald-400 max-h-[75vh] max-w-3xl mx-auto"
        style={{
          backgroundColor: '#070807',
        }}
      >
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-2xl text-slate-50 font-mono">Analysis History</DrawerTitle>
          <DrawerDescription className="text-slate-300 font-mono">
            View your past phishing analyses
          </DrawerDescription>
        </DrawerHeader>
        
        <div 
          className="overflow-y-auto px-6 sm:px-8 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-mono">
              No analysis history found
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {analyses.map((analysis) => {
                const isExpanded = expandedIds.has(analysis.id);
                const { date, time } = formatDate(analysis.createdAt);
                const confidence = analysis.mlResult ? (analysis.mlResult.phishing_probability * 100).toFixed(1) : '0.0';
                const emailHeaders = analysis.inputContent ? parseEmailHeaders(analysis.inputContent) : null;
                
                return (
                  <Card
                    key={analysis.id}
                    className={`bg-slate-800/60 border-emerald-500/30 transition-all ${
                      isExpanded ? 'border-emerald-500' : ''
                    }`}
                    style={{
                      backgroundColor: 'rgba(10, 13, 10, 0.5)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 20px rgba(16, 185, 129, 0.08)',
                      border: '1px solid #093d0f',
                    }}
                  >
                    {/* Clickable Header Section */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-emerald-500/5 transition-colors w-full"
                      onClick={() => toggleExpand(analysis.id)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {analysis.mlResult ? (
                            analysis.mlResult.is_phishing ? (
                              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-slate-300 font-mono">{date}</span>
                              <span className="text-xs text-slate-500">•</span>
                              <span className="text-sm text-slate-400 font-mono">{time}</span>
                            </div>
                            {analysis.mlResult && (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge
                                  className={
                                    analysis.mlResult.is_phishing
                                      ? 'bg-red-500/20 text-red-400 border-red-500 text-xs'
                                      : 'bg-green-500/20 text-green-400 border-green-500 text-xs'
                                  }
                                >
                                  {analysis.mlResult.is_phishing ? 'Phishing' : 'Safe'}
                                </Badge>
                                <span className="text-xs text-slate-400 font-mono">
                                  {confidence}% confidence
                                </span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500 text-xs">
                                  {analysis.inputType.toUpperCase()}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(analysis.id);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex-shrink-0 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-emerald-500/20">
                        {/* User Information - Selectable */}
                        <div className="pt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono">
                            <User className="w-4 h-4" />
                            <span>User Information</span>
                          </div>
                          <div className="pl-6">
                            <div 
                              className="text-xs text-slate-300 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50 select-all"
                              style={{
                                userSelect: 'text',
                                WebkitUserSelect: 'text',
                              }}
                            >
                              <span className="text-slate-400">Email:</span> {analysis.userEmail || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Email Headers */}
                        {emailHeaders && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono">
                              <Mail className="w-4 h-4" />
                              <span>Email Headers</span>
                            </div>
                            <div className="pl-6 space-y-2 text-xs font-mono">
                              <div className="text-slate-300">
                                <span className="text-slate-400">Message ID</span>{' '}
                                <span className="text-emerald-400">&lt;{emailHeaders.messageId}&gt;</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="text-slate-400">Created at:</span>{' '}
                                <span className="text-emerald-400">{emailHeaders.date}</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="text-slate-400">From:</span>{' '}
                                <span className="text-emerald-400">{emailHeaders.from}</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="text-slate-400">To:</span>{' '}
                                <span className="text-emerald-400">{emailHeaders.to}</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="text-slate-400">Subject:</span>{' '}
                                <span className="text-emerald-400">{emailHeaders.subject}</span>
                              </div>
                              <div className="text-slate-300">
                                <span className="text-slate-400">SPF:</span>{' '}
                                <span className="text-emerald-400">{emailHeaders.spf}</span>
                                {' '}with IP{' '}
                                <span className="text-emerald-400">{emailHeaders.spfIp}</span>
                                {' '}
                                <span className="text-slate-500 text-[10px]">Learn more</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Analysis Details */}
                        {analysis.mlResult && (
                          <div className="space-y-2">
                            <div className="text-sm text-emerald-400 font-mono">Analysis Details</div>
                            <div className="pl-6 space-y-1">
                              <div className="text-xs text-slate-400 font-mono">
                                <span className="text-slate-300">Classification:</span>{' '}
                                <span className={analysis.mlResult.is_phishing ? 'text-red-400' : 'text-green-400'}>
                                  {analysis.mlResult.is_phishing ? 'Phishing Threat Detected' : 'Legitimate Email'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                <span className="text-slate-300">Confidence:</span> {confidence}%
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Analysis Content - Full Email */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono">
                            <Mail className="w-4 h-4" />
                            <span>Analysis Content</span>
                          </div>
                          <div className="pl-6">
                            <div 
                              className="text-xs text-slate-300 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50 max-h-60 overflow-y-auto"
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {analysis.inputContent || 'No content available'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}


