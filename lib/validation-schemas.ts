import { z } from "zod";
import DOMPurify from "dompurify";

/**
 * Comprehensive validation schemas for the Polling App
 * These schemas ensure data integrity and security across client and server
 */

// Create DOMPurify instance for server-side rendering
const createDOMPurify = () => {
  if (typeof window === "undefined") {
    // Server-side: return a mock DOMPurify that strips HTML tags
    return {
      sanitize: (html: string) => html.replace(/<[^>]*>/g, ""), // Strip HTML tags
      version: "server-side",
    };
  }
  // Client-side: use the global DOMPurify
  return DOMPurify;
};

const domPurify = createDOMPurify();

// Enhanced string validation with sanitization
const sanitizedString = z
  .string()
  .min(1, "Text is required")
  .max(500, "Text is too long")
  .transform((val) => {
    // Sanitize the string using DOMPurify
    return domPurify
      .sanitize(val)
      .trim();
  });

// Base poll option validation with sanitization
const pollOptionSchema = z
  .string()
  .min(1, "Option text is required")
  .max(100, "Option must be less than 100 characters")
  .refine((value) => value.trim().length > 0, {
    message: "Option text cannot be empty",
  })
  .transform((val) => {
    // Sanitize the string using DOMPurify
    return domPurify
      .sanitize(val)
      .trim();
  });

// Poll creation schema with comprehensive validation and sanitization
export const createPollSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .refine((value) => value.trim().length >= 3, {
      message: "Title must be at least 3 characters after trimming whitespace",
    })
    .transform((val) => {
      // Sanitize the string using DOMPurify
      return domPurify
        .sanitize(val)
        .trim();
    }),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => {
      if (!val) return "";
      // Sanitize the string using DOMPurify
      return domPurify
        .sanitize(val)
        .trim();
    }),

  options: z
    .array(pollOptionSchema)
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed")
    .refine(
      (options) => {
        // Check for unique options (case-insensitive)
        const texts = options.map((opt) => opt.trim().toLowerCase());
        return new Set(texts).size === texts.length;
      },
      { message: "Options must be unique" },
    )
    .refine(
      (options) => {
        // Ensure all options have content after trimming
        return options.every((option) => option.trim().length > 0);
      },
      { message: "All options must have content" },
    ),
});

// Poll update schema (same as create but all fields optional)
export const updatePollSchema = createPollSchema.partial();

// Vote schema
export const voteSchema = z.object({
  option_id: z.string().uuid("Invalid option ID format"),
});

// Poll search schema
export const searchPollsSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query too long"),
  limit: z.number().min(1).max(50).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// User authentication schema
export const authSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Poll analytics schema
export const analyticsSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID format"),
  time_range: z
    .enum(["hour", "day", "week", "month"])
    .optional()
    .default("day"),
});

// Form validation helpers
export const validatePollForm = (data: unknown) => {
  return createPollSchema.safeParse(data);
};

export const validateVote = (data: unknown) => {
  return voteSchema.safeParse(data);
};

export const validateSearch = (data: unknown) => {
  return searchPollsSchema.safeParse(data);
};

// Type exports for TypeScript
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type SearchPollsInput = z.infer<typeof searchPollsSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;

// Error formatting utilities
export const formatValidationErrors = (error: z.ZodError) => {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
};

// Sanitization helpers
export const sanitizePollData = (data: CreatePollInput): CreatePollInput => {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || "",
    options: data.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0),
  };
};

// Validation with sanitization
export const validateAndSanitizePoll = (data: unknown) => {
  const validation = validatePollForm(data);

  if (!validation.success) {
    return {
      success: false,
      errors: formatValidationErrors(validation.error),
      data: null,
    };
  }

  const sanitized = sanitizePollData(validation.data);

  return {
    success: true,
    errors: [],
    data: sanitized,
  };
};
