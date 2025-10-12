// src/components/generation/GenerationApp.tsx
import React from 'react';
import { GenerationProvider } from './GenerationContext';
import { ErrorBoundary } from './ErrorBoundary';
import { AccessibilityProvider } from './AccessibilityProvider';
import { GeneratePage } from './GeneratePage';

export function GenerationApp() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <GenerationProvider>
          <GeneratePage />
        </GenerationProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}
