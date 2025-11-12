import { useState } from 'react';
import { Shield, Link as LinkIcon, Mail, ArrowLeft, AlertTriangle, CheckCircle, XCircle, History, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import LetterGlitch from './animations/LetterGlitch';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { mlService, backendService } from '@/services/api';
import { toast } from 'sonner';
import type { AnalysisResultUI } from '@/types/api';
import { HistoryDrawer } from './HistoryDrawer';

interface PhishingCheckerProps {
  onBack: () => void;
}

export function PhishingChecker({ onBack }: PhishingCheckerProps) {
  const { isAuthenticated, getAccessTokenSilently, user, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResultUI | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Convert API response to UI format
  const mapToUIResult = (apiResult: any): AnalysisResultUI => {
    // Use phishing_probability from API (0.0-1.0)
    const confidence = (apiResult.phishing_probability ?? 0) * 100;
    
    let threatLevel: 'low' | 'medium' | 'high' | 'critical';
    if (confidence > 75) threatLevel = 'critical';
    else if (confidence > 50) threatLevel = 'high';
    else if (confidence > 25) threatLevel = 'medium';
    else threatLevel = 'low';

    return {
      isPhishing: apiResult.is_phishing || false,
      confidence,
      threatLevel,
      indicators: [],
      details: {},
    };
  };

  const analyzeUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const mlResult = await mlService.predictPhishing(url);
      const uiResult = mapToUIResult(mlResult);

      // Ensure minimum 2 second analyzing animation
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 2000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));

      setResult(uiResult);

      // Auto-save to backend if authenticated
        if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          await backendService.submitHeader(url, token);
          // Silently save - no toast notification for auto-save
        } catch (error: any) {
          console.error('Failed to auto-save to backend:', error);
          // Don't show error to user, just log it
        }
      }

      toast.success('Analysis complete');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze URL');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeEmail = async () => {
    if (!emailContent.trim() && !selectedFile) {
      toast.error('Please paste email content or upload a file');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    const startTime = Date.now();

    try {
      let content = emailContent;
      
      // If file is selected, read it
      if (selectedFile) {
        if (!selectedFile.name.endsWith('.eml')) {
          toast.error('Please upload a .eml file');
          setAnalyzing(false);
          return;
        }
        
        if (isAuthenticated) {
          // Upload file to backend
          const token = await getAccessTokenSilently();
          const backendResult = await backendService.uploadFile(selectedFile, token);
          
          if (backendResult.result) {
            const uiResult = mapToUIResult(backendResult.result);
            
            // Ensure minimum 2 second analyzing animation
            const elapsedTime = Date.now() - startTime;
            const remainingDelay = Math.max(0, 2000 - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));

            setResult(uiResult);
            toast.success('Analysis complete');
            setAnalyzing(false);
            return;
          } else {
            // Still pending, use ML API as fallback
            content = await selectedFile.text();
          }
        } else {
          // Guest mode - read file and use ML API
          content = await selectedFile.text();
        }
      }

      // Use ML API for analysis
      const mlResult = await mlService.predictPhishing(content);
      const uiResult = mapToUIResult(mlResult);

      // Ensure minimum 2 second analyzing animation
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 2000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));

      setResult(uiResult);

      // Auto-save to backend (if not already saved via file upload)
      if (isAuthenticated && !selectedFile) {
        try {
          const token = await getAccessTokenSilently();
          await backendService.submitHeader(content, token);
          // Silently save - no toast notification for auto-save
        } catch (error: any) {
          console.error('Failed to auto-save to backend:', error);
        }
      }

      toast.success('Analysis complete');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze email');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEmailContent(''); // Clear text content when file is selected
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getResultMessage = (isPhishing: boolean, threatLevel: string): { title: string; message: string } => {
    if (isPhishing) {
      switch (threatLevel) {
        case 'critical':
          return {
            title: '🚨 CRITICAL THREAT',
            message: 'This email is highly likely to be a phishing attempt. Do NOT click any links, download attachments, or provide personal information. Delete this email immediately and report it as spam/phishing to your email provider.',
          };
        case 'high':
          return {
            title: '⚠️ HIGH RISK',
            message: 'This email shows strong indicators of being phishing. Exercise extreme caution. Do not click links or provide any sensitive information. Verify the sender through official channels before responding.',
          };
        case 'medium':
          return {
            title: '⚠️ SUSPICIOUS',
            message: 'This email contains some phishing indicators. Be careful when interacting with it. Avoid clicking unfamiliar links and never share sensitive data through email.',
          };
        default:
          return {
            title: '⚠️ LOW RISK PHISHING',
            message: 'This email may contain phishing elements. Review it carefully before taking any action. When in doubt, verify the sender through official channels.',
          };
      }
    } else {
      return {
        title: '✅ APPEARS LEGITIMATE',
        message: 'This email appears to be safe based on our analysis. However, always exercise caution and verify requests for sensitive information. Stay vigilant against social engineering tactics.',
      };
    }
  };

  return (
    <div className="min-h-screen bg-black text-emerald-400">
      
      {/* Header */}
      <div className="border-b border-emerald-500/30 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack}
              variant="ghost"
              className="text-emerald-400 hover:text-slate-50 hover:bg-emerald-500/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-mono text-slate-50">PhishSafe</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                Guest Mode
              </Badge>
            )}
            {isAuthenticated && (
              <>
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="outline"
                  className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span className="font-mono text-sm">
                        {user?.name || user?.email || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-mono">
                      {user?.email || 'User Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="url" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/60 border border-emerald-500/30">
            <TabsTrigger value="url" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-slate-50 text-slate-300">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL Scanner
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-slate-50 text-slate-300">
              <Mail className="w-4 h-4 mr-2" />
              Email Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-6">
            <Card className="bg-slate-900/60 border-emerald-500/30 p-6">
              <h2 className="text-xl mb-4 text-slate-50">Scan Suspicious Link</h2>
              <div className="space-y-4">
                <Input 
                  placeholder="https://suspicious-website.com/login"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono placeholder:text-slate-500 focus:border-emerald-500"
                />
                <Button 
                  onClick={analyzeUrl}
                  disabled={!url || analyzing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg shadow-emerald-500/30"
                >
                  {analyzing ? 'Analyzing...' : 'Scan URL'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <Card className="bg-slate-900/60 border-emerald-500/30 p-6">
              <h2 className="text-xl mb-4 text-slate-50">Analyze Email Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Upload .eml file (optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file"
                      accept=".eml"
                      onChange={handleFileChange}
                      className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono"
                    />
                    {selectedFile && (
                      <span className="text-sm text-emerald-400">{selectedFile.name}</span>
                    )}
                  </div>
                </div>
                <div className="text-center text-slate-400 text-sm">OR</div>
                <div>
                  <Textarea 
                    placeholder="Paste full raw email with headers (Delivered-To, Received, From, To, Subject, etc.) and body content..."
                    value={emailContent}
                    onChange={(e) => {
                      setEmailContent(e.target.value);
                      setSelectedFile(null); // Clear file when text is entered
                    }}
                    className="bg-slate-900/50 border-emerald-500/30 text-slate-100 font-mono min-h-[200px] placeholder:text-slate-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    Paste the complete email including all headers and body content
                  </p>
                </div>
                <Button 
                  onClick={analyzeEmail}
                  disabled={(!emailContent && !selectedFile) || analyzing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-lg shadow-emerald-500/30"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Email'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Analysis Progress */}
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-8"
          >
            <Card className="bg-slate-900/80 border-emerald-500/30 p-12 shadow-lg shadow-emerald-500/10 flex flex-col items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
                <h3 className="text-2xl text-slate-50 font-mono">
                  <LetterGlitch text="ANALYZING THREAT..." glitchIntensity={0.15} />
                </h3>
                <p className="text-slate-300 font-mono text-sm">
                  Running neural network analysis...
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {result && !analyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto mt-8"
          >
            <Card className={`border-2 p-8 ${
              result.isPhishing 
                ? 'bg-red-950/20 border-red-500' 
                : 'bg-green-950/20 border-green-500'
            }`}>
              <div className="flex items-start gap-4 mb-6">
                {result.isPhishing ? (
                  <XCircle className="w-16 h-16 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-16 h-16 text-green-500 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <h2 className={`text-3xl mb-2 ${result.isPhishing ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.isPhishing ? 'THREAT DETECTED' : 'APPEARS SAFE'}
                  </h2>
                  <p className="text-lg text-slate-200">
                    Confidence: {result.confidence.toFixed(1)}%
                  </p>
                </div>

                <Badge className={`${getThreatColor(result.threatLevel)} border-current text-lg px-4 py-2`}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {result.threatLevel.toUpperCase()}
                </Badge>
              </div>

                <Progress value={result.confidence} className="mb-3 h-3" />

              <div className={`p-4 rounded-lg border ${
                 result.isPhishing
                  ? 'border-red-500/50 bg-red-950/30'
                  : 'border-green-500/50 bg-green-950/30'
              }`}>
                <h3 className={`text-lg font-mono mb-3 ${
                  result.isPhishing ? 'text-red-300' : 'text-green-300'
                }`}>
                  {getResultMessage(result.isPhishing, result.threatLevel).title}
                </h3>
                <p className="text-slate-100 leading-relaxed font-mono text-sm">
                  {getResultMessage(result.isPhishing, result.threatLevel).message}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {isAuthenticated && (
        <HistoryDrawer open={showHistory} onOpenChange={setShowHistory} />
      )}
    </div>
  );
}


