import { useEffect, useState } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  className?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export default function DecryptedText({ 
  text, 
  speed = 100, 
  className = '' 
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= text.length) {
      setDisplayText(text);
      return;
    }

    const scrambleInterval = setInterval(() => {
      setDisplayText(
        text.split('').map((char, index) => {
          if (index < currentIndex) return char;
          if (char === ' ') return ' ';
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );
    }, 50);

    const revealTimeout = setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => {
      clearInterval(scrambleInterval);
      clearTimeout(revealTimeout);
    };
  }, [currentIndex, text, speed]);

  return <span className={className}>{displayText || text}</span>;
}


