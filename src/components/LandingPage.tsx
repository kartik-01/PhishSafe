import { useState } from 'react';
import { Shield, Lock, Mail } from 'lucide-react';
import PixelBlast from './animations/PixelBlast';
import DecryptedText from './animations/DecryptedText';
import FaultyTerminal from './animations/FaultyTerminal';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface LandingPageProps {
  onStartCheck: () => void;
  onAuth: () => void;
}

export function LandingPage({ onStartCheck, onAuth }: LandingPageProps) {
  const [showTerminal, setShowTerminal] = useState(false);

  const terminalLines = [
    'Initializing security protocols...',
    'Loading threat database...',
    'Neural network ready.',
    'System online. Ready to analyze.',
  ];

  return (
    <div className="min-h-screen bg-black text-emerald-400 relative overflow-hidden">
      {/* Pixel Blast Background */}
      <div className="absolute inset-0 opacity-50" style={{ width: '100%', height: '100%' }}>
        <PixelBlast 
          variant="circle"
          pixelSize={6}
          color="#10b981"
          patternScale={3}
          patternDensity={1.0}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Shield className="w-16 h-16 text-emerald-400" />
            <h1 className="text-6xl text-slate-50">
              <DecryptedText text="PhishSafe" />
            </h1>
          </div>
          
          <p className="text-xl text-slate-200 font-mono">
            <DecryptedText text="Intelligent Email Protection System" />
          </p>
        </motion.div>

        {/* Terminal Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="max-w-3xl mx-auto mb-12 bg-slate-900/80 border border-emerald-500/30 p-6 rounded-lg shadow-lg shadow-emerald-500/10"
          onMouseEnter={() => setShowTerminal(true)}
        >
          {showTerminal ? (
            <FaultyTerminal lines={terminalLines} />
          ) : (
            <div className="font-mono text-emerald-400/50">
              <span className="text-emerald-400">{'>'}</span> Hover to initialize...
              <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
            </div>
          )}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Button 
            onClick={onStartCheck}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg border border-emerald-500 shadow-lg shadow-emerald-500/30"
          >
            <Shield className="w-5 h-5 mr-2" />
            Start Guest Analysis
          </Button>
          
          <Button 
            onClick={onAuth}
            variant="outline"
            className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:text-white px-8 py-6 text-lg"
          >
            <Lock className="w-5 h-5 mr-2" />
            Login / Sign Up
          </Button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto"
        >
          <div className="bg-slate-900/60 border border-emerald-500/30 p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Shield className="w-10 h-10 mb-4 text-emerald-400" />
            <h3 className="text-xl mb-2 text-slate-50">Link Scanner</h3>
            <p className="text-slate-300 font-mono text-sm">
              Analyze suspicious URLs for phishing indicators
            </p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Mail className="w-10 h-10 mb-4 text-emerald-400" />
            <h3 className="text-xl mb-2 text-slate-50">Email Analysis</h3>
            <p className="text-slate-300 font-mono text-sm">
              Parse .eml files and detect malicious headers
            </p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Lock className="w-10 h-10 mb-4 text-emerald-400" />
            <h3 className="text-xl mb-2 text-slate-50">Threat Score</h3>
            <p className="text-slate-300 font-mono text-sm">
              AI-powered risk assessment in real-time
            </p>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-center mt-12 text-emerald-400/50 font-mono text-sm"
        >
          Guest mode: Instant analysis • No logs • No data stored
        </motion.p>
      </div>
    </div>
  );
}

