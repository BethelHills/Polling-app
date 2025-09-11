"use client";

import { forwardRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, X, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertMessageProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showAnimation?: boolean;
  persistent?: boolean;
}

export const AlertMessage = forwardRef<HTMLDivElement, AlertMessageProps>(
  (
    {
      type,
      title,
      message,
      onDismiss,
      className,
      showIcon = true,
      autoClose = false,
      autoCloseDelay = 5000,
      showAnimation = true,
      persistent = false,
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const getIcon = () => {
      switch (type) {
        case "success":
          return <CheckCircle className="h-5 w-5" />;
        case "error":
          return <AlertCircle className="h-5 w-5" />;
        case "warning":
          return <AlertCircle className="h-5 w-5" />;
        case "info":
          return <Info className="h-5 w-5" />;
        default:
          return null;
      }
    };

    const getStyles = () => {
      switch (type) {
        case "success":
          return "bg-green-50 text-green-800 border-green-200 hover:bg-green-100/50";
        case "error":
          return "bg-red-50 text-red-800 border-red-200 hover:bg-red-100/50";
        case "warning":
          return "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100/50";
        case "info":
          return "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/50";
        default:
          return "bg-gray-50 text-gray-800 border-gray-200";
      }
    };

    const handleDismiss = useCallback(() => {
      if (showAnimation) {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, 200);
      } else {
        setIsVisible(false);
        onDismiss?.();
      }
    }, [showAnimation, onDismiss]);

    // Auto-close functionality
    useEffect(() => {
      if (autoClose && !persistent && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    }, [autoClose, autoCloseDelay, persistent, onDismiss, handleDismiss]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "relative p-4 rounded-lg border transition-all duration-300 ease-out",
          getStyles(),
          showAnimation && "animate-in slide-in-from-top-2 duration-300",
          isAnimating && "animate-out slide-out-to-top-2 duration-200",
          className,
        )}
        role="alert"
        aria-live="polite"
      >
        {/* Special effect for success messages */}
        {type === "success" && showAnimation && (
          <div className="absolute -top-1 -right-1 animate-pulse">
            <Sparkles className="h-3 w-3 text-green-500" />
          </div>
        )}

        <div className="flex items-start gap-3">
          {showIcon && (
            <div className="flex-shrink-0 mt-0.5 relative">
              {getIcon()}
              {type === "success" && showAnimation && (
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                {title}
                {type === "success" && showAnimation && (
                  <span className="text-xs animate-bounce">✨</span>
                )}
              </h4>
            )}
            <p className="text-sm leading-relaxed">{message}</p>
          </div>

          {onDismiss && !persistent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && !persistent && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-100 ease-linear",
                type === "success"
                  ? "bg-green-500"
                  : type === "error"
                    ? "bg-red-500"
                    : type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500",
              )}
              style={{
                animation: `shrink ${autoCloseDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

AlertMessage.displayName = "AlertMessage";
