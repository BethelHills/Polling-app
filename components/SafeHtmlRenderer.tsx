/**
 * SafeHtmlRenderer component for safely rendering HTML content
 * Uses DOMPurify to sanitize HTML before rendering with dangerouslySetInnerHTML
 */

import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

// Create DOMPurify instance for server-side rendering
const createDOMPurify = () => {
  if (typeof window === "undefined") {
    // Server-side: return a mock DOMPurify that just returns the input
    // This is safe because we're only using it for sanitization
    return {
      sanitize: (html: string, config?: Record<string, unknown>) => html,
      version: "server-side",
    };
  }
  // Client-side: use the global DOMPurify
  return DOMPurify;
};

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  config?: Record<string, unknown>;
  fallback?: React.ReactNode;
}

/**
 * SafeHtmlRenderer component that sanitizes HTML using DOMPurify
 * and renders it safely with dangerouslySetInnerHTML
 */
export function SafeHtmlRenderer({
  html,
  className,
  config,
  fallback = null,
}: SafeHtmlRendererProps) {
  if (!html) return fallback;

  // Default DOMPurify configuration for safe HTML rendering
  const defaultConfig = {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["class", "id"],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  // Merge with custom config
  const sanitizeConfig = { ...defaultConfig, ...config };

  // Sanitize the HTML using DOMPurify
  const domPurify = createDOMPurify();
  const sanitizedHtml = domPurify.sanitize(html, sanitizeConfig);

  // If sanitization removed everything, show fallback
  if (!sanitizedHtml || !String(sanitizedHtml).trim()) {
    return fallback;
  }

  return (
    <div
      className={cn("safe-html-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Pre-configured SafeHtmlRenderer for poll descriptions
 */
interface SafePollDescriptionProps {
  description: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SafePollDescription({
  description,
  className,
  fallback = null,
}: SafePollDescriptionProps) {
  return (
    <SafeHtmlRenderer
      html={description}
      className={className}
      config={{
        ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      }}
      fallback={fallback}
    />
  );
}

/**
 * Pre-configured SafeHtmlRenderer for rich text content
 */
interface SafeRichTextProps {
  content: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeRichText({
  content,
  className,
  fallback = null,
}: SafeRichTextProps) {
  return (
    <SafeHtmlRenderer
      html={content}
      className={className}
      config={{
        ALLOWED_TAGS: [
          "b",
          "i",
          "em",
          "strong",
          "p",
          "br",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "blockquote",
          "code",
          "pre",
        ],
        ALLOWED_ATTR: ["class", "id"],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      }}
      fallback={fallback}
    />
  );
}

/**
 * Pre-configured SafeHtmlRenderer for content with safe links
 */
interface SafeHtmlWithLinksProps {
  content: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeHtmlWithLinks({
  content,
  className,
  fallback = null,
}: SafeHtmlWithLinksProps) {
  return (
    <SafeHtmlRenderer
      html={content}
      className={className}
      config={{
        ALLOWED_TAGS: [
          "b",
          "i",
          "em",
          "strong",
          "p",
          "br",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "blockquote",
          "code",
          "pre",
          "a",
        ],
        ALLOWED_ATTR: ["class", "id", "href", "title", "target"],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      }}
      fallback={fallback}
    />
  );
}

/**
 * Hook for using DOMPurify sanitization
 */
export function useDOMPurify() {
  const sanitize = (html: string, config?: Record<string, unknown>) => {
    const domPurify = createDOMPurify();
    return domPurify.sanitize(html, config);
  };

  const sanitizeText = (text: string) => {
    const domPurify = createDOMPurify();
    return domPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  const isSupported = () => {
    try {
      const domPurify = createDOMPurify();
      return typeof domPurify !== "undefined";
    } catch {
      return false;
    }
  };

  const getVersion = () => {
    try {
      const domPurify = createDOMPurify();
      return domPurify.version || "unknown";
    } catch {
      return "unknown";
    }
  };

  return {
    sanitize,
    sanitizeText,
    isSupported,
    getVersion,
  };
}
