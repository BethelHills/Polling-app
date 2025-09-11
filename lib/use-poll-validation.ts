import { useState, useCallback } from "react";
import {
  createPollSchema,
  type CreatePollInput,
} from "@/lib/validation-schemas";
import { z } from "zod";

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}

interface UsePollValidationReturn {
  validate: (data: Partial<CreatePollInput>) => ValidationState;
  validateField: (
    field: keyof CreatePollInput,
    value: unknown,
    allData?: Partial<CreatePollInput>,
  ) => string | null;
  clearErrors: () => void;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Custom hook for poll form validation using Zod schemas
 * Provides real-time validation and error handling
 */
export function usePollValidation(): UsePollValidationReturn {
  const [state, setState] = useState<ValidationState>({
    errors: {},
    isValid: false,
    isDirty: false,
  });

  const validate = useCallback(
    (data: Partial<CreatePollInput>): ValidationState => {
      try {
        // Create a partial schema for validation
        const partialSchema = createPollSchema.partial();
        const result = partialSchema.safeParse(data);

        const errors: Record<string, string> = {};

        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const field = issue.path.join(".");
            errors[field] = issue.message;
          });
        }

        const newState = {
          errors,
          isValid: Object.keys(errors).length === 0,
          isDirty: true,
        };

        setState(newState);
        return newState;
      } catch (error) {
        console.error("Validation error:", error);
        return state;
      }
    },
    [state],
  );

  const validateField = useCallback(
    (
      field: keyof CreatePollInput,
      value: unknown,
      // allData?: Partial<CreatePollInput>,
    ): string | null => {
      try {
        // Create field-specific validation
        let fieldSchema: z.ZodType<unknown>;

        switch (field) {
          case "title":
            fieldSchema = z
              .string()
              .min(3, "Title must be at least 3 characters")
              .max(200, "Title must be less than 200 characters")
              .refine((val) => val.trim().length >= 3, {
                message:
                  "Title must be at least 3 characters after trimming whitespace",
              });
            break;

          case "description":
            fieldSchema = z
              .string()
              .max(500, "Description must be less than 500 characters")
              .optional();
            break;

          case "options":
            fieldSchema = z
              .array(z.string().min(1).max(100))
              .min(2, "At least 2 options are required")
              .max(10, "Maximum 10 options allowed")
              .refine(
                (options) => {
                  const texts = options.map((opt) => opt.trim().toLowerCase());
                  return new Set(texts).size === texts.length;
                },
                { message: "Options must be unique" },
              );
            break;

          default:
            return null;
        }

        const result = fieldSchema.safeParse(value);
        return result.success
          ? null
          : result.error.issues[0]?.message || "Invalid value";
      } catch (error) {
        console.error("Field validation error:", error);
        return "Validation error";
      }
    },
    [],
  );

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
      isValid: false,
    }));
  }, []);

  return {
    validate,
    validateField,
    clearErrors,
    errors: state.errors,
    isValid: state.isValid,
    isDirty: state.isDirty,
  };
}

/**
 * Utility function for real-time form validation
 */
export const validatePollForm = (data: Partial<CreatePollInput>) => {
  const result = createPollSchema.partial().safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path.join(".");
      errors[field] = issue.message;
    });
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {} };
};

/**
 * Character count utilities
 */
export const getCharacterCount = (text: string, maxLength: number) => {
  return {
    current: text.length,
    max: maxLength,
    remaining: maxLength - text.length,
    isOverLimit: text.length > maxLength,
    percentage: Math.round((text.length / maxLength) * 100),
  };
};

/**
 * Form state management utilities
 */
export interface PollFormState {
  title: string;
  description: string;
  options: string[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export const getInitialPollFormState = (): PollFormState => ({
  title: "",
  description: "",
  options: ["", ""],
  errors: {},
  isSubmitting: false,
  isValid: false,
  isDirty: false,
});

/**
 * Sanitization utilities
 */
export const sanitizePollInput = (
  data: Partial<CreatePollInput>,
): Partial<CreatePollInput> => {
  return {
    title: data.title?.trim() || "",
    description: data.description?.trim() || "",
    options:
      data.options
        ?.map((option) => option.trim())
        .filter((option) => option.length > 0) || [],
  };
};
