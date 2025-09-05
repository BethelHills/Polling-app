"use client";

import { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedInput } from "@/components/ui/animated-input";
import {
  X,
  GripVertical,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { validateField } from "@/lib/form-validation";

interface OptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  error?: string;
  success?: boolean;
  canRemove?: boolean;
  index: number;
  className?: string;
  allOptions?: string[];
  maxLength?: number;
  showValidation?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const OptionInput = forwardRef<HTMLDivElement, OptionInputProps>(
  (
    {
      value,
      onChange,
      onRemove,
      placeholder,
      error,
      success,
      canRemove = false,
      index,
      className,
      allOptions = [],
      maxLength = 100,
      showValidation = true,
      isDragging = false,
      onDragStart,
      onDragEnd,
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Real-time validation
    useEffect(() => {
      if (hasInteracted && showValidation) {
        const error = validateField("option", value, allOptions);
        setValidationError(error);
      }
    }, [value, allOptions, hasInteracted, showValidation]);

    const handleFocus = () => {
      setIsFocused(true);
      setHasInteracted(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    };

    const currentError = error || validationError;
    const isSuccess = success && !currentError && value.trim().length > 0;
    const characterCount = value.length;
    const isNearLimit = characterCount > maxLength * 0.8;

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ease-out",
          "hover:bg-muted/50 focus-within:bg-muted/30",
          isDragging && "opacity-50 scale-95 shadow-lg",
          isFocused && "ring-2 ring-primary/20 bg-primary/5",
          currentError && "bg-red-50 border border-red-200",
          isSuccess && "bg-green-50 border border-green-200",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        role="listitem"
        aria-label={`Option ${index + 1}`}
      >
        {/* Drag handle with enhanced styling */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-200",
            "opacity-0 group-hover:opacity-60 hover:opacity-100",
            isDragging && "opacity-100",
          )}
        >
          <GripVertical
            className={cn(
              "h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing",
              "hover:text-foreground transition-colors duration-200",
            )}
          />
        </div>

        {/* Enhanced option number badge */}
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
            "border-2 border-transparent",
            isFocused
              ? "bg-primary text-primary-foreground border-primary shadow-md scale-110"
              : isSuccess
                ? "bg-green-500 text-white border-green-500"
                : currentError
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-muted text-muted-foreground border-muted-foreground/20",
            isHovered && !isFocused && "scale-105 border-muted-foreground/40",
          )}
        >
          {isSuccess ? <CheckCircle className="h-3 w-3" /> : index + 1}
        </div>

        {/* Input field with enhanced styling */}
        <div className="flex-1 relative">
          <AnimatedInput
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || `Option ${index + 1}`}
            error={currentError || undefined}
            success={isSuccess}
            className={cn(
              "transition-all duration-300",
              isFocused && "shadow-sm",
              currentError && "border-red-300 focus-visible:ring-red-200",
              isSuccess && "border-green-300 focus-visible:ring-green-200",
            )}
            aria-label={`Option ${index + 1} text input`}
            aria-describedby={
              currentError ? `option-${index}-error` : undefined
            }
            maxLength={maxLength}
          />

          {/* Character count indicator */}
          {isFocused && (
            <div
              className={cn(
                "absolute -bottom-6 right-0 text-xs transition-all duration-200",
                isNearLimit ? "text-orange-600" : "text-muted-foreground",
              )}
            >
              {characterCount}/{maxLength}
            </div>
          )}

          {/* Success sparkle animation */}
          {isSuccess && (
            <div className="absolute -top-1 -right-1 animate-pulse">
              <Sparkles className="h-3 w-3 text-green-500" />
            </div>
          )}
        </div>

        {/* Enhanced remove button */}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className={cn(
              "flex-shrink-0 transition-all duration-200 h-8 w-8 p-0",
              "opacity-0 group-hover:opacity-70 hover:opacity-100",
              isFocused && "opacity-100",
              "hover:bg-red-100 hover:text-red-600 hover:scale-110",
              "active:scale-95",
            )}
            aria-label={`Remove option ${index + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Error message */}
        {currentError && (
          <div
            id={`option-${index}-error`}
            className="absolute -bottom-8 left-0 right-0 flex items-center gap-1 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{currentError}</span>
          </div>
        )}

        {/* Subtle border animation */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-300",
            isFocused && "border-primary/30",
            currentError && "border-red-300",
            isSuccess && "border-green-300",
          )}
        />
      </div>
    );
  },
);

OptionInput.displayName = "OptionInput";
