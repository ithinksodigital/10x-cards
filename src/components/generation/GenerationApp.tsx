// src/components/generation/GenerationApp.tsx
import React from "react";
import { GenerationProvider } from "./GenerationContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { AccessibilityProvider } from "./AccessibilityProvider";
import { GeneratePage } from "./GeneratePage";
import { isFeatureEnabled } from "../../features";

export function GenerationApp() {
  const collectionsEnabled = isFeatureEnabled("collections");

  // If collections feature is disabled, show message
  if (!collectionsEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">10x Cards</h1>
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold text-foreground mb-2">Funkcjonalność niedostępna</h2>
            <p className="text-muted-foreground">
              Funkcjonalność generowania fiszek jest obecnie wyłączona w tym środowisku.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
