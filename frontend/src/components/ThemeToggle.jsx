import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Effect untuk memicu efek ripple saat tombol ditekan
  const handleToggle = (e) => {
    // Ripple effect
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'absolute rounded-full pointer-events-none bg-primary/20 transform scale-0 animate-ripple';
    
    button.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    // Toggle dark mode
    toggleDarkMode();
  };
  
  // Saat komponen mount, tambahkan transisi ke body
  useEffect(() => {
    const body = document.body;
    body.classList.add('transition-colors', 'duration-300');
    
    return () => {
      body.classList.remove('transition-colors', 'duration-300');
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("relative overflow-hidden", className)}
      aria-label={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
      title={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
    >
      <div className="relative z-10 transform transition-transform duration-500">
        {isDarkMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle; 