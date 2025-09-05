// Form validation utilities for the Polling App

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Poll form validation rules
export const validatePollForm = (formData: {
  title: string;
  description?: string;
  options: string[];
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Title validation
  if (!formData.title.trim()) {
    errors.push({ field: "title", message: "Poll title is required" });
  } else if (formData.title.trim().length < 3) {
    errors.push({
      field: "title",
      message: "Poll title must be at least 3 characters long",
    });
  } else if (formData.title.trim().length > 200) {
    errors.push({
      field: "title",
      message: "Poll title must be less than 200 characters",
    });
  }

  // Description validation (optional)
  if (formData.description && formData.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description must be less than 500 characters",
    });
  }

  // Options validation
  const validOptions = formData.options.filter(
    (option) => option.trim().length > 0,
  );

  if (validOptions.length < 2) {
    errors.push({
      field: "options",
      message: "At least 2 options are required",
    });
  } else if (validOptions.length > 10) {
    errors.push({ field: "options", message: "Maximum 10 options allowed" });
  }

  // Check for duplicate options
  const uniqueOptions = new Set(
    validOptions.map((option) => option.trim().toLowerCase()),
  );
  if (uniqueOptions.size !== validOptions.length) {
    errors.push({ field: "options", message: "Options must be unique" });
  }

  // Check individual option lengths
  validOptions.forEach((option, index) => {
    if (option.trim().length > 100) {
      errors.push({
        field: `option-${index}`,
        message: "Option text must be less than 100 characters",
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Real-time validation for individual fields
export const validateField = (
  field: string,
  value: string,
  allOptions?: string[],
): string | null => {
  switch (field) {
    case "title":
      if (!value.trim()) return "Title is required";
      if (value.trim().length < 3) return "Title must be at least 3 characters";
      if (value.trim().length > 200)
        return "Title must be less than 200 characters";
      return null;

    case "description":
      if (value.length > 500)
        return "Description must be less than 500 characters";
      return null;

    case "option":
      if (!value.trim()) return "Option text is required";
      if (value.trim().length > 100)
        return "Option must be less than 100 characters";
      if (allOptions) {
        const duplicateCount = allOptions.filter(
          (opt) => opt.trim().toLowerCase() === value.trim().toLowerCase(),
        ).length;
        if (duplicateCount > 1) return "This option already exists";
      }
      return null;

    default:
      return null;
  }
};

// Character count utility
export const getCharacterCount = (text: string, maxLength: number) => {
  return {
    current: text.length,
    max: maxLength,
    remaining: maxLength - text.length,
    isOverLimit: text.length > maxLength,
  };
};

// Form state management
export interface FormState {
  title: string;
  description: string;
  options: string[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export const getInitialFormState = (): FormState => ({
  title: "",
  description: "",
  options: ["", ""],
  errors: {},
  isSubmitting: false,
  isValid: false,
});
