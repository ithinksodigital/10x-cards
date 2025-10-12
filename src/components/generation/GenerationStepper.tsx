// src/components/generation/GenerationStepper.tsx
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type GenerationStep = 'paste' | 'review' | 'save';

interface GenerationStepperProps {
  currentStep: GenerationStep;
  onStepClick?: (step: GenerationStep) => void;
  className?: string;
}

interface StepConfig {
  id: GenerationStep;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  clickable: boolean;
}

export function GenerationStepper({ currentStep, onStepClick, className }: GenerationStepperProps) {
  const steps: StepConfig[] = [
    {
      id: 'paste',
      title: 'Paste Text',
      description: 'Enter your source text',
      completed: currentStep !== 'paste',
      current: currentStep === 'paste',
      clickable: false, // Can't go back to paste step
    },
    {
      id: 'review',
      title: 'Review Cards',
      description: 'Accept or reject generated cards',
      completed: currentStep === 'save',
      current: currentStep === 'review',
      clickable: currentStep === 'save', // Can go back from save to review
    },
    {
      id: 'save',
      title: 'Save to Set',
      description: 'Choose destination set',
      completed: false,
      current: currentStep === 'save',
      clickable: false,
    },
  ];

  const handleStepClick = (step: GenerationStep) => {
    if (onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => step.clickable && handleStepClick(step.id)}
                  disabled={!step.clickable}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    step.completed && 'bg-green-500 border-green-500 text-white',
                    step.current && !step.completed && 'bg-primary border-primary text-primary-foreground',
                    !step.completed && !step.current && 'bg-background border-border text-muted-foreground',
                    step.clickable && 'hover:scale-105 cursor-pointer',
                    !step.clickable && 'cursor-default'
                  )}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                >
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                <div className="mt-3 text-center max-w-32">
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    step.completed && 'text-green-600',
                    step.current && !step.completed && 'text-primary',
                    !step.completed && !step.current && 'text-muted-foreground'
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-5">
                  <div className={cn(
                    'h-0.5 rounded-full transition-all duration-300',
                    steps[index + 1].completed ? 'bg-green-500' : 'bg-border'
                  )} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing generation stepper state
 */
export function useGenerationStepper() {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('paste');

  const goToStep = useCallback((step: GenerationStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const stepOrder: GenerationStep[] = ['paste', 'review', 'save'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const stepOrder: GenerationStep[] = ['paste', 'review', 'save'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep('paste');
  }, []);

  return {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    reset,
  };
}
