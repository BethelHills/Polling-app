/**
 * Examples of using DOMPurify for safe HTML rendering
 * Demonstrates different patterns and configurations
 */

import DOMPurify from "dompurify";
import {
  SafeHtmlRenderer,
  SafePollDescription,
  SafeRichText,
  SafeHtmlWithLinks,
} from "@/components/SafeHtmlRenderer";

// Example 1: Direct DOMPurify usage (your pattern)
export function DirectDOMPurifyExample({
  pollDescription,
}: {
  pollDescription: string;
}) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(pollDescription),
      }}
    />
  );
}

// Example 2: DOMPurify with custom configuration
export function CustomConfigExample({ htmlContent }: { htmlContent: string }) {
  const config = {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(htmlContent, config),
      }}
    />
  );
}

// Example 3: Using SafeHtmlRenderer component
export function SafeHtmlRendererExample({ content }: { content: string }) {
  return (
    <SafeHtmlRenderer
      html={content}
      className="prose max-w-none"
      fallback={<p>No content available</p>}
    />
  );
}

// Example 4: Pre-configured components
export function PreConfiguredExamples({
  pollDescription,
  richContent,
  contentWithLinks,
}: {
  pollDescription: string;
  richContent: string;
  contentWithLinks: string;
}) {
  return (
    <div className="space-y-4">
      {/* Poll description with basic formatting */}
      <div>
        <h3>Poll Description:</h3>
        <SafePollDescription
          description={pollDescription}
          className="text-gray-700"
        />
      </div>

      {/* Rich text content */}
      <div>
        <h3>Rich Text Content:</h3>
        <SafeRichText content={richContent} className="prose" />
      </div>

      {/* Content with safe links */}
      <div>
        <h3>Content with Links:</h3>
        <SafeHtmlWithLinks content={contentWithLinks} className="prose" />
      </div>
    </div>
  );
}

// Example 5: Conditional rendering based on content type
export function ConditionalRenderingExample({
  content,
  contentType,
}: {
  content: string;
  contentType: "text" | "html" | "markdown";
}) {
  if (contentType === "text") {
    // Plain text - no HTML rendering needed
    return <p>{content}</p>;
  }

  if (contentType === "html") {
    // HTML content - use DOMPurify
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
            ALLOWED_ATTR: [],
            ALLOW_DATA_ATTR: false,
            ALLOW_UNKNOWN_PROTOCOLS: false,
          }),
        }}
      />
    );
  }

  if (contentType === "markdown") {
    // Markdown-like content - convert to HTML then sanitize
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");

    return (
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(htmlContent, {
            ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
            ALLOWED_ATTR: [],
            ALLOW_DATA_ATTR: false,
            ALLOW_UNKNOWN_PROTOCOLS: false,
          }),
        }}
      />
    );
  }

  return null;
}

// Example 6: Error handling and fallbacks
export function ErrorHandlingExample({ content }: { content: string }) {
  try {
    const sanitized = DOMPurify.sanitize(content);

    if (!sanitized.trim()) {
      return <p className="text-gray-500 italic">No content available</p>;
    }

    return (
      <div
        dangerouslySetInnerHTML={{ __html: sanitized }}
        className="content"
      />
    );
  } catch (error) {
    console.error("Error sanitizing content:", error);
    return <p className="text-red-500">Error rendering content</p>;
  }
}

// Example 7: Performance optimization with memoization
import { useMemo } from "react";

export function MemoizedDOMPurifyExample({ content }: { content: string }) {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

// Example 8: Testing different malicious inputs
export function SecurityTestExample() {
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    "<div onclick=\"alert('XSS')\">Click me</div>",
    'javascript:alert("XSS")',
    "<iframe src=\"javascript:alert('XSS')\"></iframe>",
    "<object data=\"javascript:alert('XSS')\"></object>",
    "<embed src=\"javascript:alert('XSS')\">",
    '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
  ];

  return (
    <div className="space-y-4">
      <h2>Security Test Examples</h2>
      {maliciousInputs.map((input, index) => (
        <div key={index} className="border p-4 rounded">
          <h4>Input {index + 1}:</h4>
          <code className="text-sm bg-gray-100 p-2 block mb-2">{input}</code>
          <h5>Sanitized Output:</h5>
          <div
            className="border p-2 bg-green-50"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(input),
            }}
          />
        </div>
      ))}
    </div>
  );
}
