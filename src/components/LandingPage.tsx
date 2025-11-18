import { useState, useRef, useEffect } from 'react';
import { Mail, Play, Shield, Lock } from 'lucide-react';
import PixelBlast from './animations/PixelBlast';
import DecryptedText from './animations/DecryptedText';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Navbar } from './Navbar';

interface LandingPageProps {
  onStartCheck: () => void;
  onAuth: () => void;
}

export function LandingPage({ onStartCheck, onAuth }: LandingPageProps) {
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to video when it appears
  useEffect(() => {
    if (showVideo && videoRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (videoRef.current) {
            const navbarHeight = 70;
            const scrollOffset = 30; // Small offset so video isn't right at the top
            const elementTop = videoRef.current.getBoundingClientRect().top;
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const targetScroll = currentScroll + elementTop - navbarHeight - scrollOffset;
            
            window.scrollTo({
              top: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          }
        }, 300); // Wait for animation to render
      });
    }
  }, [showVideo]);

  return (
    <div className="min-h-screen bg-black text-emerald-400 relative">
      {/* Pixel Blast Background */}
      <div className="fixed inset-0 opacity-50" style={{ width: '100%', height: '100%', zIndex: 0, minHeight: '100vh', minWidth: '100vw' }}>
        <PixelBlast 
          variant="circle"
          pixelSize={7}
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

      {/* Navbar */}
      <Navbar onAuth={onAuth} />

      <div className="relative z-10 container mx-auto px-4 py-20" style={{ position: 'relative', zIndex: 10 }}>
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
              <DecryptedText speed={50} text="SecureBeacon" />
            </h1>
          </div>
          
          <p className="text-xl text-slate-200 font-mono">
            <DecryptedText speed={50} text="Zero-Knowledge Phishing Detection System" />
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4"
        >
          <Button
            onClick={onStartCheck}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg border border-emerald-500 shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Start Guest Analysis
          </Button>

          <Button
            onClick={() => setShowVideo(!showVideo)}
            variant="outline"
            className="border-emerald-500 text-emerald-400 hover:text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            style={{
              backgroundColor: 'rgba(10, 13, 10, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              boxShadow: '0 2px 20px rgba(16, 185, 129, 0.15)',
              border: '1px solid #093d0f',
            }}
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            See How This Works
          </Button>
        </motion.div>

        {/* Video Section */}
        {showVideo && (
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto mb-8 sm:mb-12 bg-slate-900/80 border border-emerald-500/30 p-4 sm:p-6 rounded-lg shadow-lg shadow-emerald-500/10"
          >
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded"
                src="https://www.youtube.com/embed/tQ6goaZisr0"
                title="How SecureBeacon Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-5xl mx-auto px-4"
        >
          <div className="bg-slate-900/60 border border-emerald-500/30 p-4 sm:p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 text-emerald-400" />
            <h3 className="text-lg sm:text-xl mb-2 text-slate-50">End-to-End Encryption</h3>
            <p className="text-slate-300 font-mono text-sm">
              Zero-knowledge architecture. Your data is encrypted before it leaves your device. We can't read your analysis history, only you can.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 p-4 sm:p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Mail className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 text-emerald-400" />
            <h3 className="text-lg sm:text-xl mb-2 text-slate-50">Email Analysis</h3>
            <p className="text-slate-300 font-mono text-sm">
              Parse .eml files and detect malicious headers
            </p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 p-4 sm:p-6 rounded-lg hover:border-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 text-emerald-400" />
            <h3 className="text-lg sm:text-xl mb-2 text-slate-50">Threat Score</h3>
            <p className="text-slate-300 font-mono text-sm">
              AI-powered risk assessment in real-time
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

