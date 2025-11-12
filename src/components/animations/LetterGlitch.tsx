import { useEffect, useState } from 'react';

interface LetterGlitchProps {
  text: string;
  className?: string;
  glitchIntensity?: number;
}

export default function LetterGlitch({ 
  text, 
  className = '', 
  glitchIntensity = 0.1 
}: LetterGlitchProps) {
  const [glitchedText, setGlitchedText] = useState(text);
  const [showGlitch, setShowGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setShowGlitch(true);
        setGlitchedText(
          text.split('').map((char) => {
            if (Math.random() < glitchIntensity) {
              const offset = Math.floor(Math.random() * 3) - 1;
              return String.fromCharCode(char.charCodeAt(0) + offset);
            }
            return char;
          }).join('')
        );
        
        setTimeout(() => {
          setShowGlitch(false);
          setGlitchedText(text);
        }, 100);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [text, glitchIntensity]);

  return (
    <span 
      className={className}
      style={{
        textShadow: showGlitch ? '2px 0 #ff00de, -2px 0 #00fff9' : 'none',
        display: 'inline-block',
      }}
    >
      {glitchedText}
    </span>
  );
}


