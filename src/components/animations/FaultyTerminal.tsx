import { useEffect, useState } from 'react';

interface FaultyTerminalProps {
  lines: string[];
  className?: string;
}

export default function FaultyTerminal({ 
  lines, 
  className = '' 
}: FaultyTerminalProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [glitchLine, setGlitchLine] = useState(-1);

  useEffect(() => {
    if (currentIndex >= lines.length) return;

    const timeout = setTimeout(() => {
      setDisplayedLines(prev => [...prev, lines[currentIndex]]);
      
      // Random glitch effect
      if (Math.random() > 0.6) {
        setGlitchLine(currentIndex);
        setTimeout(() => setGlitchLine(-1), 150);
      }
      
      setCurrentIndex(prev => prev + 1);
    }, 600);

    return () => clearTimeout(timeout);
  }, [currentIndex, lines]);

  return (
    <div className={`font-mono ${className}`}>
      {displayedLines.map((line, i) => (
        <div
          key={i}
          className="transition-all duration-75"
          style={{
            opacity: glitchLine === i ? 0.3 : 1,
            textShadow: glitchLine === i ? '2px 0 #ff0000, -2px 0 #10b981' : 'none',
            transform: glitchLine === i ? 'translateX(2px)' : 'translateX(0)',
          }}
        >
          <span className="text-emerald-400">{'>'}</span> {line}
        </div>
      ))}
      {currentIndex < lines.length && (
        <div className="flex items-center">
          <span className="text-emerald-400">{'>'}</span>
          <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
        </div>
      )}
    </div>
  );
}


