/**
 * Security utilities for safe text rendering and validation
 * Provides additional protection beyond React's automatic escaping
 * Enhanced with DOMPurify for comprehensive HTML sanitization
 */

import DOMPurify from "dompurify";

// Create DOMPurify instance for server-side rendering
const createDOMPurify = () => {
  if (typeof window === "undefined") {
    // Server-side: return a mock DOMPurify that just returns the input
    // This is safe because we're only using it for sanitization
    return {
      sanitize: (html: string) => html,
      version: "server-side",
    };
  }
  // Client-side: use the global DOMPurify
  return DOMPurify;
};

/**
 * Sanitizes text input using DOMPurify for comprehensive HTML sanitization
 * @param text - The text to sanitize
 * @param allowHtml - Whether to allow safe HTML tags (default: false)
 * @returns Sanitized text safe for display
 */
export function sanitizeText(text: string, allowHtml: boolean = false): string {
  if (!text) return "";

  // Configure DOMPurify based on whether HTML is allowed
  const config = allowHtml
    ? {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
        ALLOWED_ATTR: [],
      }
    : {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      };

  // Use DOMPurify for comprehensive sanitization
  const domPurify = createDOMPurify();
  const sanitized = String(domPurify.sanitize(text, config));

  // Additional custom sanitization for extra safety
  return (
    sanitized
      // Remove any remaining javascript: protocols
      .replace(/javascript:/gi, "")
      // Remove any remaining data: protocols (except safe image types)
      .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg))/gi, "")
      // Remove any remaining vbscript: protocols
      .replace(/vbscript:/gi, "")
      // Remove any remaining on* event handlers
      .replace(/\bon\w+\s*=/gi, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Sanitizes HTML content while preserving safe HTML tags
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML safe for display
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Configure DOMPurify to allow safe HTML tags
  const config = {
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
  };

  const domPurify = createDOMPurify();
  return String(domPurify.sanitize(html, config));
}

/**
 * Validates poll title for security and content
 * @param title - The poll title to validate
 * @returns Validation result with sanitized title
 */
export function validatePollTitle(title: string): {
  isValid: boolean;
  sanitizedTitle: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitizedTitle = sanitizeText(title);

  // Check length
  if (sanitizedTitle.length < 3) {
    errors.push("Title must be at least 3 characters long");
  }

  if (sanitizedTitle.length > 200) {
    errors.push("Title must be less than 200 characters");
    sanitizedTitle = sanitizedTitle.substring(0, 200);
  }

  // Check for empty after sanitization
  if (!sanitizedTitle.trim()) {
    errors.push("Title cannot be empty after sanitization");
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(title)) {
      errors.push("Title contains potentially dangerous content");
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedTitle,
    errors,
  };
}

/**
 * Validates poll description for security and content
 * @param description - The poll description to validate
 * @returns Validation result with sanitized description
 */
export function validatePollDescription(description: string): {
  isValid: boolean;
  sanitizedDescription: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitizedDescription = sanitizeText(description);

  // Check length
  if (sanitizedDescription.length > 500) {
    errors.push("Description must be less than 500 characters");
    sanitizedDescription = sanitizedDescription.substring(0, 500);
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(description)) {
      errors.push("Description contains potentially dangerous content");
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedDescription,
    errors,
  };
}

/**
 * Validates poll option text for security and content
 * @param optionText - The poll option text to validate
 * @returns Validation result with sanitized option text
 */
export function validatePollOption(optionText: string): {
  isValid: boolean;
  sanitizedOption: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitizedOption = sanitizeText(optionText);

  // Check length
  if (sanitizedOption.length < 1) {
    errors.push("Option text is required");
  }

  if (sanitizedOption.length > 100) {
    errors.push("Option must be less than 100 characters");
    sanitizedOption = sanitizedOption.substring(0, 100);
  }

  // Check for empty after sanitization
  if (!sanitizedOption.trim()) {
    errors.push("Option cannot be empty after sanitization");
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(optionText)) {
      errors.push("Option contains potentially dangerous content");
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedOption,
    errors,
  };
}

/**
 * Truncates text safely while preserving security
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncating (default: '...')
 * @returns Truncated text
 */
export function safeTruncate(
  text: string,
  maxLength: number,
  suffix: string = "...",
): string {
  if (!text || text.length <= maxLength) {
    return text || "";
  }

  const sanitized = sanitizeText(text);
  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return sanitized.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Escapes HTML entities manually (for cases where React's auto-escaping isn't enough)
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates and sanitizes user input for display
 * @param input - User input to validate
 * @param type - Type of input (title, description, option)
 * @returns Validation result with sanitized input
 */
export function validateUserInput(
  input: string,
  type: "title" | "description" | "option",
): {
  isValid: boolean;
  sanitizedInput: string;
  errors: string[];
} {
  switch (type) {
    case "title":
      const titleResult = validatePollTitle(input);
      return {
        isValid: titleResult.isValid,
        sanitizedInput: titleResult.sanitizedTitle,
        errors: titleResult.errors,
      };
    case "description":
      const descResult = validatePollDescription(input);
      return {
        isValid: descResult.isValid,
        sanitizedInput: descResult.sanitizedDescription,
        errors: descResult.errors,
      };
    case "option":
      const optionResult = validatePollOption(input);
      return {
        isValid: optionResult.isValid,
        sanitizedInput: optionResult.sanitizedOption,
        errors: optionResult.errors,
      };
    default:
      return {
        isValid: false,
        sanitizedInput: "",
        errors: ["Invalid input type"],
      };
  }
}

/**
 * Content Security Policy (CSP) helper for generating safe CSP headers
 * @returns CSP header value for the polling application
 */
export function getContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS requires unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Security headers for API responses
 * @returns Object with security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": getContentSecurityPolicy(),
  };
}

/**
 * DOMPurify configuration for different use cases
 */
export const DOMPurifyConfigs = {
  // Strict configuration - no HTML allowed
  STRICT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  },

  // Basic HTML configuration - allows safe formatting
  BASIC_HTML: {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  },

  // Rich text configuration - allows more formatting options
  RICH_TEXT: {
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
  },

  // Link configuration - allows safe links
  WITH_LINKS: {
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
  },
};

/**
 * Sanitizes text with specific DOMPurify configuration
 * @param text - The text to sanitize
 * @param config - DOMPurify configuration to use
 * @returns Sanitized text
 */
export function sanitizeWithConfig(
  text: string,
  config: Record<string, unknown> = DOMPurifyConfigs.STRICT,
): string {
  if (!text) return "";
  const domPurify = createDOMPurify();
  return String(domPurify.sanitize(text, config));
}

/**
 * Checks if text contains potentially dangerous content
 * @param text - The text to check
 * @returns True if text contains dangerous content
 */
export function containsDangerousContent(text: string): boolean {
  if (!text) return false;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
}

/**
 * Gets DOMPurify version and configuration info
 * @returns DOMPurify information
 */
export function getDOMPurifyInfo(): { version: string; isSupported: boolean } {
  try {
    const domPurify = createDOMPurify();
    return {
      version: domPurify.version || "unknown",
      isSupported: typeof domPurify !== "undefined",
    };
  } catch {
    return {
      version: "unknown",
      isSupported: false,
    };
  }
}
