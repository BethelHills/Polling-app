"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  showValidationIcon?: boolean;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, error, success, showValidationIcon = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out",
            error && "border-red-500 focus-visible:ring-red-500 bg-red-50/50",
            success &&
              !error &&
              "border-green-500 focus-visible:ring-green-500 bg-green-50/50",
            isFocused && "shadow-sm scale-[1.01]",
            className,
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {showValidationIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200">
            {error && (
              <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
            )}
            {success && !error && (
              <CheckCircle className="h-4 w-4 text-green-500 animate-in zoom-in-50 duration-200" />
            )}
          </div>
        )}
      </div>
    );
  },
);

AnimatedInput.displayName = "AnimatedInput";

interface AnimatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: boolean;
  showValidationIcon?: boolean;
}

export const AnimatedTextarea = forwardRef<
  HTMLTextAreaElement,
  AnimatedTextareaProps
>(({ className, error, success, showValidationIcon = true, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
          error && "border-red-500 focus-visible:ring-red-500",
          success && !error && "border-green-500 focus-visible:ring-green-500",
          isFocused && "shadow-sm",
          className,
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {showValidationIcon && (
        <div className="absolute right-3 top-3">
          {error && <AlertCircle className="h-4 w-4 text-red-500" />}
          {success && !error && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      )}
    </div>
  );
});

AnimatedTextarea.displayName = "AnimatedTextarea";
