"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Looks good!</span>
          </div>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({
  current,
  max,
  className,
}: CharacterCounterProps) {
  const isOverLimit = current > max;
  const percentage = (current / max) * 100;

  return (
    <div className={cn("flex items-center justify-between text-xs", className)}>
      <span
        className={cn(
          "transition-colors",
          isOverLimit ? "text-red-500" : "text-muted-foreground",
        )}
      >
        {current}/{max} characters
      </span>
      {isOverLimit && (
        <span className="text-red-500 font-medium">
          {current - max} over limit
        </span>
      )}
    </div>
  );
}
