// src/components/generation/AccessibilityProvider.tsx
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AccessibilityContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  setPageTitle: (title: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
  }>>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Math.random().toString(36).substr(2, 9);
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Remove announcement after a delay
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    }, 1000);
  }, []);

  const setPageTitle = useCallback((title: string) => {
    document.title = title;
  }, []);

  const value: AccessibilityContextValue = {
    announce,
    setPageTitle,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* ARIA Live Regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(announcement => (
            <div key={announcement.id}>
              {announcement.message}
            </div>
          ))
        }
      </div>
      
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(announcement => (
            <div key={announcement.id}>
              {announcement.message}
            </div>
          ))
        }
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation() {
  const handleKeyDown = useCallback((e: KeyboardEvent, handlers: Record<string, () => void>) => {
    const key = e.key.toLowerCase();
    
    // Don't interfere with form inputs
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        e.target instanceof HTMLSelectElement) {
      return;
    }
    
    if (handlers[key]) {
      e.preventDefault();
      handlers[key]();
    }
  }, []);

  return { handleKeyDown };
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { focusElement, trapFocus };
}
