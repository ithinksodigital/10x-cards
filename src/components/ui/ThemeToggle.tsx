// src/components/ui/ThemeToggle.tsx
import React from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className={cn(
        "relative h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative h-4 w-4">
        {/* Sun icon */}
        <svg
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx={12} cy={12} r={5} />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        
        {/* Moon icon */}
        <svg
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </Button>
  );
}
