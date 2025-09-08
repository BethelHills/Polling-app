"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { AlertMessage } from "@/components/ui/alert-message";
import { createPoll } from "@/lib/mock-actions";
import { Plus, X, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// Zod schema for form validation
const pollFormSchema = z.object({
  title: z
    .string()
    .min(1, "Question is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  options: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, "Option text is required")
          .max(100, "Option must be less than 100 characters"),
      }),
    )
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed")
    .refine(
      (options) => {
        const texts = options.map((opt) => opt.text.trim().toLowerCase());
        return new Set(texts).size === texts.length;
      },
      { message: "Options must be unique" },
    ),
});

type PollFormData = z.infer<typeof pollFormSchema>;

export function PollForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning" | "info";
    text: string;
  } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ text: "" }, { text: "" }],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");
  const watchedTitle = watch("title");
  const watchedDescription = watch("description");

  const onSubmit = async (data: PollFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Create FormData for the server action
      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", data.description?.trim() || "");
      data.options.forEach((option) => {
        if (option.text.trim()) {
          formData.append("options", option.text.trim());
        }
      });

      const result = await createPoll(formData);

      if (result.success && result.pollId) {
        setMessage({ type: "success", text: result.message });
        // Reset form
        reset();
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
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append({ text: "" });
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const getCharacterCount = (text: string, maxLength: number) => {
    return {
      current: text.length,
      max: maxLength,
      remaining: maxLength - text.length,
      isOverLimit: text.length > maxLength,
    };
  };

  const titleCount = getCharacterCount(watchedTitle, 200);
  const descriptionCount = getCharacterCount(watchedDescription || "", 500);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create New Poll
        </CardTitle>
        <CardDescription>
          Use this form to create a new poll with advanced validation and form
          management.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Poll Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Poll Title <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="title"
                {...register("title")}
                placeholder="What's your poll about?"
                className={cn(
                  "transition-all duration-200",
                  errors.title && "border-red-500 focus-visible:ring-red-500",
                  !errors.title &&
                    watchedTitle.length >= 3 &&
                    "border-green-500 focus-visible:ring-green-500",
                )}
              />
              {titleCount.current > 0 && (
                <div
                  className={cn(
                    "absolute -bottom-5 right-0 text-xs transition-colors duration-200",
                    titleCount.isOverLimit
                      ? "text-red-600"
                      : "text-muted-foreground",
                  )}
                >
                  {titleCount.current}/{titleCount.max}
                </div>
              )}
            </div>
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.title.message}
              </p>
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
                {...register("description")}
                placeholder="Add more context about your poll..."
                rows={3}
                className={cn(
                  "resize-none transition-all duration-200",
                  errors.description &&
                    "border-red-500 focus-visible:ring-red-500",
                  !errors.description &&
                    (watchedDescription?.length || 0) > 0 &&
                    "border-green-500 focus-visible:ring-green-500",
                )}
              />
              {descriptionCount.current > 0 && (
                <div
                  className={cn(
                    "absolute -bottom-5 right-0 text-xs transition-colors duration-200",
                    descriptionCount.isOverLimit
                      ? "text-red-600"
                      : "text-muted-foreground",
                  )}
                >
                  {descriptionCount.current}/{descriptionCount.max}
                </div>
              )}
            </div>
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Poll Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Poll Options</Label>
                <p className="text-xs text-muted-foreground">
                  Minimum 2, maximum 10 options
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={fields.length >= 10}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const optionError = errors.options?.[index]?.text;
                const optionValue = watchedOptions[index]?.text || "";
                const isSuccess = !optionError && optionValue.trim().length > 0;

                return (
                  <div
                    key={field.id}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                      "hover:bg-muted/50 focus-within:bg-muted/30",
                      optionError && "border-red-200 bg-red-50",
                      isSuccess && "border-green-200 bg-green-50",
                    )}
                  >
                    {/* Drag handle */}
                    <div className="opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </div>

                    {/* Option number badge */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                        optionError
                          ? "bg-red-500 text-white"
                          : isSuccess
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Input field */}
                    <div className="flex-1">
                      <Input
                        {...register(`options.${index}.text`)}
                        placeholder={`Option ${index + 1}`}
                        className={cn(
                          "transition-all duration-200",
                          optionError &&
                            "border-red-300 focus-visible:ring-red-200",
                          isSuccess &&
                            "border-green-300 focus-visible:ring-green-200",
                        )}
                      />
                    </div>

                    {/* Remove button */}
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        aria-label={`Remove option ${index + 1}`}
                        className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Error message */}
                    {optionError && (
                      <div className="absolute -bottom-6 left-0 right-0 text-xs text-red-600">
                        {optionError.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Options validation error */}
            {errors.options &&
              typeof errors.options === "object" &&
              "message" in errors.options && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.options.message}
                </p>
              )}

            {fields.length < 2 && (
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
              disabled={!isValid || isSubmitting}
              className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Poll...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Poll
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
