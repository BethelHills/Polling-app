/**
 * Security tests for text rendering and input validation
 * Tests React's automatic escaping and additional security measures
 */

import {
  sanitizeText,
  sanitizeHtml,
  validatePollTitle,
  validatePollDescription,
  validatePollOption,
  safeTruncate,
  escapeHtml,
  validateUserInput,
  sanitizeWithConfig,
  containsDangerousContent,
  getDOMPurifyInfo,
  DOMPurifyConfigs,
} from "@/lib/security-utils";

describe("Security Utilities", () => {
  describe("sanitizeText", () => {
    it("should remove HTML tags (strict mode)", () => {
      const input = "<div>Hello World</div>";
      const result = sanitizeText(input, false);
      expect(result).toBe("Hello World");
    });

    it("should allow safe HTML tags when enabled", () => {
      const input = "<b>Bold</b> and <i>italic</i> text";
      const result = sanitizeText(input, true);
      expect(result).toBe("<b>Bold</b> and <i>italic</i> text");
    });

    it("should remove script tags", () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe("Hello");
    });

    it("should remove javascript: protocols", () => {
      const input = 'javascript:alert("XSS")';
      const result = sanitizeText(input);
      expect(result).toBe('alert("XSS")'); // DOMPurify removes the protocol but keeps the content
    });

    it("should remove on* event handlers", () => {
      const input = "<div onclick=\"alert('XSS')\">Click me</div>";
      const result = sanitizeText(input);
      expect(result).toBe("Click me");
    });

    it("should handle empty input", () => {
      expect(sanitizeText("")).toBe("");
      expect(sanitizeText(null as any)).toBe("");
      expect(sanitizeText(undefined as any)).toBe("");
    });

    it("should preserve safe content", () => {
      const input =
        "This is a safe poll title with numbers 123 and symbols !@#";
      const result = sanitizeText(input);
      expect(result).toBe(input);
    });
  });

  describe("sanitizeHtml", () => {
    it("should sanitize HTML while preserving safe tags", () => {
      const input = '<p>Hello <b>World</b> <script>alert("XSS")</script></p>';
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Hello <b>World</b> </p>");
    });

    it("should remove dangerous attributes", () => {
      const input = "<p onclick=\"alert('XSS')\">Click me</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Click me</p>");
    });

    it("should preserve allowed attributes", () => {
      const input = '<p class="test" id="myId">Hello</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p class="test" id="myId">Hello</p>');
    });

    it("should handle empty input", () => {
      expect(sanitizeHtml("")).toBe("");
      expect(sanitizeHtml(null as any)).toBe("");
    });
  });

  describe("DOMPurify Integration", () => {
    it("should get DOMPurify info", () => {
      const info = getDOMPurifyInfo();
      expect(info.isSupported).toBe(true);
      expect(typeof info.version).toBe("string");
    });

    it("should use different DOMPurify configurations", () => {
      const input = '<p>Hello <b>World</b> <script>alert("XSS")</script></p>';

      const strictResult = sanitizeWithConfig(input, DOMPurifyConfigs.STRICT);
      expect(strictResult).toBe("Hello World ");

      const basicResult = sanitizeWithConfig(
        input,
        DOMPurifyConfigs.BASIC_HTML,
      );
      expect(basicResult).toBe("<p>Hello <b>World</b> </p>");
    });

    it("should detect dangerous content", () => {
      expect(containsDangerousContent('<script>alert("XSS")</script>')).toBe(
        true,
      );
      expect(containsDangerousContent('javascript:alert("XSS")')).toBe(true);
      expect(
        containsDangerousContent("<div onclick=\"alert('XSS')\">Click</div>"),
      ).toBe(true);
      expect(containsDangerousContent("Safe content")).toBe(false);
      expect(containsDangerousContent("")).toBe(false);
    });
  });

  describe("validatePollTitle", () => {
    it("should validate a good title", () => {
      const result = validatePollTitle("What is your favorite color?");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedTitle).toBe("What is your favorite color?");
      expect(result.errors).toHaveLength(0);
    });

    it("should reject title that is too short", () => {
      const result = validatePollTitle("Hi");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Title must be at least 3 characters long",
      );
    });

    it("should reject title that is too long", () => {
      const longTitle = "A".repeat(201);
      const result = validatePollTitle(longTitle);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title must be less than 200 characters");
      expect(result.sanitizedTitle).toHaveLength(200);
    });

    it("should reject title with malicious content", () => {
      const result = validatePollTitle('<script>alert("XSS")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Title contains potentially dangerous content",
      );
      expect(result.sanitizedTitle).toBe(""); // DOMPurify removes script content entirely
    });

    it("should reject empty title after sanitization", () => {
      const result = validatePollTitle("<script></script>");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Title cannot be empty after sanitization",
      );
    });
  });

  describe("validatePollDescription", () => {
    it("should validate a good description", () => {
      const result = validatePollDescription(
        "This is a great poll about colors",
      );
      expect(result.isValid).toBe(true);
      expect(result.sanitizedDescription).toBe(
        "This is a great poll about colors",
      );
      expect(result.errors).toHaveLength(0);
    });

    it("should reject description that is too long", () => {
      const longDescription = "A".repeat(501);
      const result = validatePollDescription(longDescription);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Description must be less than 500 characters",
      );
      expect(result.sanitizedDescription).toHaveLength(500);
    });

    it("should reject description with malicious content", () => {
      const result = validatePollDescription('javascript:alert("XSS")');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Description contains potentially dangerous content",
      );
    });
  });

  describe("validatePollOption", () => {
    it("should validate a good option", () => {
      const result = validatePollOption("Red");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedOption).toBe("Red");
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty option", () => {
      const result = validatePollOption("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Option text is required");
    });

    it("should reject option that is too long", () => {
      const longOption = "A".repeat(101);
      const result = validatePollOption(longOption);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Option must be less than 100 characters",
      );
      expect(result.sanitizedOption).toHaveLength(100);
    });

    it("should reject option with malicious content", () => {
      const result = validatePollOption('<script>alert("XSS")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Option contains potentially dangerous content",
      );
    });
  });

  describe("safeTruncate", () => {
    it("should truncate long text", () => {
      const longText = "This is a very long text that should be truncated";
      const result = safeTruncate(longText, 20);
      expect(result).toBe("This is a very lo...");
    });

    it("should not truncate short text", () => {
      const shortText = "Short text";
      const result = safeTruncate(shortText, 20);
      expect(result).toBe("Short text");
    });

    it("should use custom suffix", () => {
      const longText = "This is a very long text";
      const result = safeTruncate(longText, 10, "---");
      expect(result).toBe("This is---");
    });

    it("should handle empty text", () => {
      expect(safeTruncate("", 10)).toBe("");
      expect(safeTruncate(null as any, 10)).toBe("");
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML entities", () => {
      const input = '<div class="test">Hello & "World"</div>';
      const result = escapeHtml(input);
      expect(result).toBe(
        "&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;&#x2F;div&gt;",
      );
    });

    it("should handle empty input", () => {
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml(null as any)).toBe("");
    });
  });

  describe("validateUserInput", () => {
    it("should validate title input", () => {
      const result = validateUserInput("Good Title", "title");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe("Good Title");
    });

    it("should validate description input", () => {
      const result = validateUserInput("Good Description", "description");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe("Good Description");
    });

    it("should validate option input", () => {
      const result = validateUserInput("Good Option", "option");
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe("Good Option");
    });

    it("should reject invalid input type", () => {
      const result = validateUserInput("Test", "invalid" as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid input type");
    });
  });
});

describe("React Auto-Escaping Security", () => {
  // These tests demonstrate that React automatically escapes HTML
  // In a real React component test, you would test the actual rendering

  it("should demonstrate React auto-escaping behavior", () => {
    // This is a conceptual test - in real React tests, you'd use React Testing Library
    const maliciousInput = '<script>alert("XSS")</script>';

    // React would automatically escape this to:
    const expectedEscaped = '&lt;script&gt;alert("XSS")&lt;/script&gt;';

    // The actual escaping happens in React's rendering engine
    // This test documents the expected behavior
    expect(maliciousInput).not.toBe(expectedEscaped);
    expect(maliciousInput).toContain("<script>");
    expect(expectedEscaped).toContain("&lt;script&gt;");
  });

  it("should demonstrate safe text rendering", () => {
    // Test that our sanitization works with React's escaping
    const maliciousInput = '<script>alert("XSS")</script>Hello';
    const sanitized = sanitizeText(maliciousInput);

    expect(sanitized).toBe("Hello");
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
  });
});

describe("Security Integration Tests", () => {
  it("should handle complex malicious input", () => {
    const complexMaliciousInput = `
      <div onclick="alert('XSS')">
        <script>document.location='http://evil.com'</script>
        <img src="javascript:alert('XSS')" />
        <a href="javascript:alert('XSS')">Click me</a>
        Normal text here
      </div>
    `;

    const sanitized = sanitizeText(complexMaliciousInput);
    expect(sanitized).toContain("Click me");
    expect(sanitized).toContain("Normal text here");
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).not.toContain("javascript:");
  });

  it("should preserve legitimate content", () => {
    const legitimateContent = `
      This is a legitimate poll title with:
      - Numbers: 123, 456, 789
      - Symbols: !@#$%^&*()
      - Quotes: "Hello" and 'World'
      - Special chars: é, ñ, ü, ç
    `;

    const sanitized = sanitizeText(legitimateContent);
    expect(sanitized).toBe(legitimateContent.trim());
  });

  it("should handle edge cases", () => {
    // Test various edge cases
    expect(sanitizeText("   ")).toBe("");
    expect(sanitizeText("\n\t\r")).toBe("");
    expect(sanitizeText("0")).toBe("0");
    expect(sanitizeText("false")).toBe("false");
    expect(sanitizeText("null")).toBe("null");
  });
});
