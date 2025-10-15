// src/components/generation/PasteTextarea.tsx
import React, { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PasteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors?: Record<string, string>) => void;
  disabled?: boolean;
  className?: string;
}

const MIN_LENGTH = 100;
const MAX_LENGTH = 15000;
const CHUNK_SUGGESTION_THRESHOLD = 10000;

export function PasteTextarea({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  className,
}: PasteTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;

  const validateText = useCallback((text: string): { isValid: boolean; errors?: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (text.length < MIN_LENGTH) {
      errors.length = `Text must be at least ${MIN_LENGTH} characters`;
    }

    if (text.length > MAX_LENGTH) {
      errors.length = `Text must not exceed ${MAX_LENGTH} characters`;
    }

    const isValid = Object.keys(errors).length === 0;

    return { isValid, errors: isValid ? undefined : errors };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (onValidationChange) {
        const validation = validateText(newValue);
        onValidationChange(validation.isValid, validation.errors);
      }
    },
    [onChange, onValidationChange, validateText]
  );

  const validation = validateText(value);
  const showChunkSuggestion = charCount > CHUNK_SUGGESTION_THRESHOLD;

  // Calculate progress for visual feedback
  const progress = Math.min((charCount / MAX_LENGTH) * 100, 100);
  const progressColor =
    charCount < MIN_LENGTH
      ? "bg-muted"
      : charCount > MAX_LENGTH
        ? "bg-red-500"
        : charCount > CHUNK_SUGGESTION_THRESHOLD
          ? "bg-yellow-500"
          : "bg-green-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor="paste-textarea" className="text-sm font-medium text-foreground">
          Paste your text
        </label>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-mono",
              charCount < MIN_LENGTH && "text-muted-foreground",
              charCount >= MIN_LENGTH && charCount <= MAX_LENGTH && "text-green-600",
              charCount > MAX_LENGTH && "text-red-600"
            )}
          >
            {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-300", progressColor)} style={{ width: `${progress}%` }} />
      </div>

      <div className="relative">
        <Textarea
          id="paste-textarea"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Paste your text here (minimum 100 characters)..."
          className={cn(
            "min-h-[300px] font-mono text-sm leading-relaxed resize-y",
            !isFocused && !validation.isValid && charCount > 0 && "border-red-300 focus:border-red-500",
            className
          )}
        />
      </div>

      {/* Error messages */}
      {!validation.isValid && charCount > 0 && (
        <div className="text-sm text-red-600">
          {Object.values(validation.errors || {}).map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}

      {/* Chunk suggestion */}
      {showChunkSuggestion && validation.isValid && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Large text detected</p>
            <p className="mt-1">
              Your text is quite long ({charCount.toLocaleString()} characters). The AI will automatically process it
              and generate flashcards. This may take a bit longer.
            </p>
          </div>
        </div>
      )}

      {/* Helper text */}
      {charCount === 0 && (
        <p className="text-sm text-muted-foreground">
          Paste or type text between {MIN_LENGTH} and {MAX_LENGTH.toLocaleString()} characters. The AI will generate
          flashcards based on your content.
        </p>
      )}

      {validation.isValid && charCount > 0 && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ready to generate flashcards
        </p>
      )}
    </div>
  );
}
