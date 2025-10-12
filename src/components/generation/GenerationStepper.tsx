// src/components/generation/GenerationStepper.tsx
import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
  icon: React.ReactNode;
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
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      completed: currentStep !== 'paste',
      current: currentStep === 'paste',
      clickable: false, // Can't go back to paste step
    },
    {
      id: 'review',
      title: 'Review Cards',
      description: 'Accept or reject generated cards',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      completed: currentStep === 'save',
      current: currentStep === 'review',
      clickable: currentStep === 'save', // Can go back from save to review
    },
    {
      id: 'save',
      title: 'Save to Set',
      description: 'Choose destination set',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
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
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => step.clickable && handleStepClick(step.id)}
                disabled={!step.clickable}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  step.completed && 'bg-green-500 border-green-500 text-white',
                  step.current && !step.completed && 'bg-blue-500 border-blue-500 text-white',
                  !step.completed && !step.current && 'bg-white border-gray-300 text-gray-400',
                  step.clickable && 'hover:scale-105 cursor-pointer',
                  !step.clickable && 'cursor-default'
                )}
                aria-label={`Step ${index + 1}: ${step.title}`}
              >
                {step.completed ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </button>
              
              <div className="mt-2 text-center">
                <div className={cn(
                  'text-sm font-medium',
                  step.completed && 'text-green-600',
                  step.current && !step.completed && 'text-blue-600',
                  !step.completed && !step.current && 'text-gray-500'
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <Separator 
                  className={cn(
                    'h-0.5',
                    steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                  )} 
                />
              </div>
            )}
          </React.Fragment>
        ))}
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
