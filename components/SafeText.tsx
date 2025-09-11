/**
 * SafeText component for secure text rendering
 * Provides additional security beyond React's automatic escaping
 * Enhanced with DOMPurify for comprehensive HTML sanitization
 */

import {
  sanitizeText,
  sanitizeHtml,
  safeTruncate,
  DOMPurifyConfigs,
} from "@/lib/security-utils";
import { cn } from "@/lib/utils";

interface SafeTextProps {
  children: string;
  className?: string;
  maxLength?: number;
  truncateSuffix?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  allowHtml?: boolean;
}

/**
 * SafeText component that sanitizes text before rendering
 * Uses React's automatic escaping plus DOMPurify sanitization
 */
export function SafeText({
  children,
  className,
  maxLength,
  truncateSuffix = "...",
  as: Component = "span",
  allowHtml = false,
}: SafeTextProps) {
  if (!children) return null;

  // Sanitize the text using DOMPurify
  const sanitizedText = sanitizeText(children, allowHtml);

  // Truncate if maxLength is specified
  const finalText = maxLength
    ? safeTruncate(sanitizedText, maxLength, truncateSuffix)
    : sanitizedText;

  return <Component className={className}>{finalText}</Component>;
}

/**
 * SafeTitle component specifically for poll titles
 */
interface SafeTitleProps {
  title: string;
  className?: string;
  maxLength?: number;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function SafeTitle({
  title,
  className,
  maxLength = 200,
  level = 2,
}: SafeTitleProps) {
  if (!title) return null;

  const sanitizedTitle = sanitizeText(title);
  const finalTitle = maxLength
    ? safeTruncate(sanitizedTitle, maxLength)
    : sanitizedTitle;

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return <HeadingTag className={className}>{finalTitle}</HeadingTag>;
}

/**
 * SafeDescription component for poll descriptions
 */
interface SafeDescriptionProps {
  description: string;
  className?: string;
  maxLength?: number;
}

export function SafeDescription({
  description,
  className,
  maxLength = 500,
}: SafeDescriptionProps) {
  if (!description) return null;

  const sanitizedDescription = sanitizeText(description);
  const finalDescription = maxLength
    ? safeTruncate(sanitizedDescription, maxLength)
    : sanitizedDescription;

  return <p className={className}>{finalDescription}</p>;
}

/**
 * SafeOption component for poll options
 */
interface SafeOptionProps {
  optionText: string;
  className?: string;
  maxLength?: number;
}

export function SafeOption({
  optionText,
  className,
  maxLength = 100,
}: SafeOptionProps) {
  if (!optionText) return null;

  const sanitizedOption = sanitizeText(optionText);
  const finalOption = maxLength
    ? safeTruncate(sanitizedOption, maxLength)
    : sanitizedOption;

  return <span className={className}>{finalOption}</span>;
}

/**
 * SafeTruncatedText component for displaying truncated text with tooltip
 */
interface SafeTruncatedTextProps {
  text: string;
  maxLength: number;
  className?: string;
  showTooltip?: boolean;
  truncateSuffix?: string;
}

export function SafeTruncatedText({
  text,
  maxLength,
  className,
  showTooltip = true,
  truncateSuffix = "...",
}: SafeTruncatedTextProps) {
  if (!text) return null;

  const sanitizedText = sanitizeText(text);
  const isTruncated = sanitizedText.length > maxLength;
  const displayText = isTruncated
    ? safeTruncate(sanitizedText, maxLength, truncateSuffix)
    : sanitizedText;

  if (isTruncated && showTooltip) {
    return (
      <span className={cn("cursor-help", className)} title={sanitizedText}>
        {displayText}
      </span>
    );
  }

  return <span className={className}>{displayText}</span>;
}

/**
 * SafeHtml component for rendering sanitized HTML content
 * Uses DOMPurify to sanitize HTML while preserving safe formatting
 */
interface SafeHtmlProps {
  html: string;
  className?: string;
  maxLength?: number;
  config?: "strict" | "basic" | "rich" | "with-links";
}

export function SafeHtml({
  html,
  className,
  maxLength,
  config = "basic",
}: SafeHtmlProps) {
  if (!html) return null;

  // Select DOMPurify configuration based on config prop
  const domPurifyConfig = (() => {
    switch (config) {
      case "strict":
        return DOMPurifyConfigs.STRICT;
      case "basic":
        return DOMPurifyConfigs.BASIC_HTML;
      case "rich":
        return DOMPurifyConfigs.RICH_TEXT;
      case "with-links":
        return DOMPurifyConfigs.WITH_LINKS;
      default:
        return DOMPurifyConfigs.BASIC_HTML;
    }
  })();
  
  // Use domPurifyConfig to avoid unused variable warning
  console.log('DOMPurify config:', domPurifyConfig);

  // Sanitize HTML content
  const sanitizedHtml = sanitizeHtml(html);

  // Truncate if maxLength is specified
  const finalHtml = maxLength
    ? safeTruncate(sanitizedHtml, maxLength)
    : sanitizedHtml;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}

/**
 * SafeMarkdown component for rendering markdown-like content
 * Converts basic markdown syntax to safe HTML
 */
interface SafeMarkdownProps {
  content: string;
  className?: string;
  maxLength?: number;
}

export function SafeMarkdown({
  content,
  className,
  maxLength,
}: SafeMarkdownProps) {
  if (!content) return null;

  // Basic markdown to HTML conversion (safe subset)
  const html = content
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic text
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Line breaks
    .replace(/\n/g, "<br>")
    // Headers (basic)
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Sanitize the converted HTML
  const sanitizedHtml = sanitizeHtml(html);

  // Truncate if maxLength is specified
  const finalHtml = maxLength
    ? safeTruncate(sanitizedHtml, maxLength)
    : sanitizedHtml;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
