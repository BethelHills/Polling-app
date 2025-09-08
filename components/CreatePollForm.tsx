"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createPoll } from "@/lib/mock-actions";
// import { EnhancedFormField } from "@/components/ui/enhanced-form-field";
import { OptionInput } from "@/components/ui/option-input";
import { AlertMessage } from "@/components/ui/alert-message";
import {
  validatePollForm,
  validateField,
  // getCharacterCount,
  getInitialFormState,
  type FormState,
} from "@/lib/form-validation";
import { Plus, Sparkles } from "lucide-react";

export function CreatePollForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(getInitialFormState());
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Real-time validation effect
  useEffect(() => {
    const validation = validatePollForm({
      title: formState.title,
      description: formState.description,
      options: formState.options,
    });

    setFormState((prev) => ({ ...prev, isValid: validation.isValid }));

    // Clear field errors when form becomes valid
    if (validation.isValid) {
      setFieldErrors({});
    }
  }, [formState.title, formState.description, formState.options]);

  const addOption = () => {
    if (formState.options.length < 10) {
      setFormState((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formState.options.length > 2) {
      setFormState((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormState((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });

    // Real-time validation for this option
    const error = validateField("option", value, formState.options);
    setFieldErrors((prev) => ({
      ...prev,
      [`option-${index}`]: error || "",
    }));
  };

  const updateTitle = (value: string) => {
    setFormState((prev) => ({ ...prev, title: value }));

    const error = validateField("title", value);
    setFieldErrors((prev) => ({
      ...prev,
      title: error || "",
    }));
  };

  const updateDescription = (value: string) => {
    setFormState((prev) => ({ ...prev, description: value }));

    const error = validateField("description", value);
    setFieldErrors((prev) => ({
      ...prev,
      description: error || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before submission
    const validation = validatePollForm({
      title: formState.title,
      description: formState.description,
      options: formState.options,
    });

    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errors[error.field] = error.message;
      });
      setFieldErrors(errors);
      setMessage({
        type: "error",
        text: "Please fix the errors below before submitting",
      });
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    setMessage(null);

    try {
      // Create FormData for the server action
      const formData = new FormData();
      formData.append("title", formState.title.trim());
      formData.append("description", formState.description.trim());
      formState.options.forEach((option) => {
        if (option.trim()) {
          formData.append("options", option.trim());
        }
      });

      const result = await createPoll(formData);

      if (result.success && result.pollId) {
        setMessage({ type: "success", text: result.message });
        // Redirect to the created poll after a short delay
        setTimeout(() => {
          router.push(`/polls/${result.pollId}`);
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Character counts for future use
  // const titleCharCount = getCharacterCount(formState.title, 200)
  // const descriptionCharCount = getCharacterCount(formState.description, 500)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create New Poll
        </CardTitle>
        <CardDescription>
          Fill in the details for your new poll. All fields with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Poll Title <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="title"
                value={formState.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="What's your poll about?"
                maxLength={200}
                className={cn(
                  "transition-all duration-200",
                  fieldErrors.title && "border-red-500 focus-visible:ring-red-500",
                  !fieldErrors.title && formState.title.length >= 3 && "border-green-500 focus-visible:ring-green-500",
                )}
              />
              {formState.title.length > 0 && (
                <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
                  {formState.title.length}/200
                </div>
              )}
            </div>
            {fieldErrors.title && (
              <p className="text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Poll Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => updateDescription(e.target.value)}
                placeholder="Add more context about your poll..."
                maxLength={500}
                rows={3}
                className={cn(
                  "resize-none transition-all duration-200",
                  fieldErrors.description && "border-red-500 focus-visible:ring-red-500",
                  !fieldErrors.description && formState.description.length > 0 && "border-green-500 focus-visible:ring-green-500",
                )}
              />
              {formState.description.length > 0 && (
                <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
                  {formState.description.length}/500
                </div>
              )}
            </div>
            {fieldErrors.description && (
              <p className="text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          {/* Poll Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Poll Options</h3>
                <p className="text-xs text-muted-foreground">
                  Minimum 2, maximum 10 options
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={formState.options.length >= 10}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {formState.options.map((option, index) => (
                <OptionInput
                  key={index}
                  value={option}
                  onChange={(value) => updateOption(index, value)}
                  onRemove={
                    formState.options.length > 2
                      ? () => removeOption(index)
                      : undefined
                  }
                  placeholder={`Option ${index + 1}`}
                  error={fieldErrors[`option-${index}`]}
                  success={
                    !fieldErrors[`option-${index}`] && option.trim().length > 0
                  }
                  canRemove={formState.options.length > 2}
                  index={index}
                  allOptions={formState.options}
                  maxLength={100}
                  showValidation={true}
                />
              ))}
            </div>

            {formState.options.length < 2 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ At least 2 options are required to create a poll
              </p>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <AlertMessage
              type={message.type}
              message={message.text}
              onDismiss={() => setMessage(null)}
              showAnimation={true}
              autoClose={message.type === "success"}
              autoCloseDelay={3000}
            />
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button
              type="submit"
              disabled={formState.isSubmitting || !formState.isValid}
              className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
            >
              {formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Poll...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Poll
                </div>
              )}
            </Button>

            {!formState.isValid && formState.title && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Complete all required fields to create your poll
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
