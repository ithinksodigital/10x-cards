// src/components/generation/FlashCard.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAccessibility } from "./AccessibilityProvider";
import type { FlashCardProposal } from "@/lib/view-models";

interface FlashCardProps {
  proposal: FlashCardProposal;
  index: number;
  isSelected?: boolean;
  isRejected?: boolean;
  disabled?: boolean;
  onAccept: (cardId: string) => void;
  onReject: (cardId: string) => void;
  onEditSave: (cardId: string, front: string, back: string) => void;
  className?: string;
}

const FRONT_MAX_LENGTH = 200;
const BACK_MAX_LENGTH = 500;

export function FlashCard({
  proposal,
  index,
  isSelected = false,
  isRejected = false,
  disabled = false,
  onAccept,
  onReject,
  onEditSave,
  className,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(proposal.front);
  const [editBack, setEditBack] = useState(proposal.back);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const cardRef = useRef<HTMLDivElement>(null);
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);
  const backTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { announce } = useAccessibility();

  // Reset edit state when proposal changes
  useEffect(() => {
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setEditErrors({});
  }, [proposal.id]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && frontTextareaRef.current) {
      frontTextareaRef.current.focus();
    }
  }, [isEditing]);

  const validateEdit = useCallback((front: string, back: string) => {
    const errors: Record<string, string> = {};

    if (front.trim().length === 0) {
      errors.front = "Front text is required";
    } else if (front.length > FRONT_MAX_LENGTH) {
      errors.front = `Front text must not exceed ${FRONT_MAX_LENGTH} characters`;
    }

    if (back.trim().length === 0) {
      errors.back = "Back text is required";
    } else if (back.length > BACK_MAX_LENGTH) {
      errors.back = `Back text must not exceed ${BACK_MAX_LENGTH} characters`;
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  const handleFlip = useCallback(() => {
    if (!isEditing && !disabled) {
      setIsFlipped(!isFlipped);
    }
  }, [isFlipped, isEditing, disabled]);

  const handleEditStart = useCallback(() => {
    if (!disabled) {
      setIsEditing(true);
      setIsFlipped(false); // Show front when editing
    }
  }, [disabled]);

  const handleEditSave = useCallback(() => {
    if (validateEdit(editFront, editBack)) {
      onEditSave(proposal.id, editFront.trim(), editBack.trim());
      setIsEditing(false);
    }
  }, [editFront, editBack, proposal.id, onEditSave, validateEdit]);

  const handleEditCancel = useCallback(() => {
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setEditErrors({});
    setIsEditing(false);
  }, [proposal.front, proposal.back]);

  const handleAccept = useCallback(() => {
    if (!disabled) {
      onAccept(proposal.id);
      announce(`Card ${index + 1} accepted`, "polite");
    }
  }, [disabled, proposal.id, onAccept, announce, index]);

  const handleReject = useCallback(() => {
    if (!disabled) {
      onReject(proposal.id);
      announce(`Card ${index + 1} rejected`, "polite");
    }
  }, [disabled, proposal.id, onReject, announce, index]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || !cardRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          if (isEditing) {
            handleEditSave();
          } else {
            handleFlip();
          }
          break;
        case "Escape":
          e.preventDefault();
          if (isEditing) {
            handleEditCancel();
          }
          break;
        case "a":
        case "A":
          if (!isEditing) {
            e.preventDefault();
            handleAccept();
          }
          break;
        case "r":
        case "R":
          if (!isEditing) {
            e.preventDefault();
            handleReject();
          }
          break;
        case "e":
        case "E":
          if (!isEditing) {
            e.preventDefault();
            handleEditStart();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled, isEditing, handleFlip, handleEditSave, handleEditCancel, handleAccept, handleReject, handleEditStart]);

  const getCardStatus = () => {
    if (isSelected) return "selected";
    if (isRejected) return "rejected";
    return "neutral";
  };

  const cardStatus = getCardStatus();

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative w-full h-64 cursor-pointer transition-all duration-300",
        "hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500",
        "transform-gpu perspective-1000",
        cardStatus === "selected" && "ring-2 ring-green-500 bg-green-50",
        cardStatus === "rejected" && "ring-2 ring-red-500 bg-red-50",
        cardStatus === "neutral" && "hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleFlip}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard ${index + 1}: ${isFlipped ? "Back" : "Front"} side`}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header with badges and actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
            {proposal.was_edited && (
              <Badge variant="secondary" className="text-xs">
                Edited
              </Badge>
            )}
            {proposal.ai_confidence_score && (
              <Badge variant={proposal.ai_confidence_score > 0.8 ? "default" : "secondary"} className="text-xs">
                {Math.round(proposal.ai_confidence_score * 100)}% confidence
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStart();
                  }}
                  className="h-6 w-6 p-0"
                  disabled={disabled}
                  aria-label="Edit card"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept();
                  }}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  disabled={disabled}
                  aria-label="Accept card"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject();
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  disabled={disabled}
                  aria-label="Reject card"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Card content */}
        <div className="flex-1 flex flex-col">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Front</label>
                <Textarea
                  ref={frontTextareaRef}
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  className={cn("min-h-[60px] resize-none", editErrors.front && "border-red-300 focus:border-red-500")}
                  placeholder="Enter front text..."
                  maxLength={FRONT_MAX_LENGTH}
                />
                <div className="flex justify-between items-center mt-1">
                  {editErrors.front && <span className="text-xs text-red-600">{editErrors.front}</span>}
                  <span className="text-xs text-gray-500 ml-auto">
                    {editFront.length}/{FRONT_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Back</label>
                <Textarea
                  ref={backTextareaRef}
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  className={cn("min-h-[80px] resize-none", editErrors.back && "border-red-300 focus:border-red-500")}
                  placeholder="Enter back text..."
                  maxLength={BACK_MAX_LENGTH}
                />
                <div className="flex justify-between items-center mt-1">
                  {editErrors.back && <span className="text-xs text-red-600">{editErrors.back}</span>}
                  <span className="text-xs text-gray-500 ml-auto">
                    {editBack.length}/{BACK_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSave();
                  }}
                  disabled={Object.keys(editErrors).length > 0}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCancel();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">{isFlipped ? "Back" : "Front"}</div>
                <div className="text-lg leading-relaxed break-words">{isFlipped ? proposal.back : proposal.front}</div>
              </div>

              {proposal.source_text_excerpt && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <div className="font-medium mb-1">Source excerpt:</div>
                  <div className="line-clamp-2">{proposal.source_text_excerpt}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flip indicator */}
        {!isEditing && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            Click to flip • {isFlipped ? "Front" : "Back"}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {!isEditing && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            A: Accept • R: Reject • E: Edit • Space: Flip
          </div>
        )}
      </CardContent>
    </Card>
  );
}
