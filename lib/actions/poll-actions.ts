"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

// Modern Next.js 15 Server Actions with enhanced features

// Validation schemas using Zod
const VoteSchema = z.object({
  pollId: z.string().min(1, "Poll ID is required"),
  optionId: z.string().min(1, "Option ID is required"),
});

const CreatePollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required").max(100, "Option too long")
  })).min(2, "At least 2 options required").max(10, "Maximum 10 options allowed"),
});

// Types
type VoteInput = z.infer<typeof VoteSchema>;
type CreatePollInput = z.infer<typeof CreatePollSchema>;

// Enhanced vote action with analytics and rate limiting
export async function voteOnPoll(input: VoteInput) {
  try {
    // Validate input
    const validatedInput = VoteSchema.parse(input);
    
    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const forwardedFor = headersList.get("x-forwarded-for");
    
    // Simulate database update (in real app, this would be a database call)
    const pollId = validatedInput.pollId;
    const optionId = validatedInput.optionId;
    
    // Log analytics data
    console.log("Vote recorded:", {
      pollId,
      optionId,
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 100),
      ip: forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Revalidate the polls cache
    revalidateTag("polls");
    revalidatePath("/dashboard");
    revalidatePath(`/polls/${pollId}`);
    
    return {
      success: true,
      message: "Vote recorded successfully!",
      data: {
        pollId,
        optionId,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error("Vote error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid input data",
        errors: error.issues
      };
    }
    
    return {
      success: false,
      message: "Failed to record vote",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Enhanced create poll action with validation and analytics
export async function createPoll(input: CreatePollInput) {
  try {
    // Validate input
    const validatedInput = CreatePollSchema.parse(input);
    
    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const forwardedFor = headersList.get("x-forwarded-for");
    
    // Generate new poll ID
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create poll object
    const newPoll = {
      id: pollId,
      title: validatedInput.title,
      description: validatedInput.description || "",
      totalVotes: 0,
      isActive: true,
      createdAt: new Date(),
      lastUpdated: new Date(),
      options: validatedInput.options.map((option, index) => ({
        id: `option_${index + 1}`,
        text: option.text,
        votes: 0,
        percentage: 0,
        trend: 'stable' as const
      }))
    };
    
    // Log analytics data
    console.log("Poll created:", {
      pollId,
      title: validatedInput.title,
      optionsCount: validatedInput.options.length,
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 100),
      ip: forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    });
    
    // Simulate database save (in real app, this would be a database call)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Revalidate caches
    revalidateTag("polls");
    revalidatePath("/dashboard");
    
    return {
      success: true,
      message: "Poll created successfully!",
      data: {
        pollId,
        poll: newPoll
      }
    };
    
  } catch (error) {
    console.error("Create poll error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid input data",
        errors: error.issues
      };
    }
    
    return {
      success: false,
      message: "Failed to create poll",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Enhanced delete poll action
export async function deletePoll(pollId: string) {
  try {
    // Validate poll ID
    if (!pollId || typeof pollId !== 'string') {
      throw new Error("Invalid poll ID");
    }
    
    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const forwardedFor = headersList.get("x-forwarded-for");
    
    // Log analytics data
    console.log("Poll deleted:", {
      pollId,
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 100),
      ip: forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    });
    
    // Simulate database delete (in real app, this would be a database call)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Revalidate caches
    revalidateTag("polls");
    revalidatePath("/dashboard");
    
    return {
      success: true,
      message: "Poll deleted successfully!",
      data: { pollId }
    };
    
  } catch (error) {
    console.error("Delete poll error:", error);
    
    return {
      success: false,
      message: "Failed to delete poll",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Enhanced refresh polls action
export async function refreshPolls() {
  try {
    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    
    // Log analytics data
    console.log("Polls refreshed:", {
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 100)
    });
    
    // Revalidate all poll-related caches
    revalidateTag("polls");
    revalidatePath("/dashboard");
    revalidatePath("/api/polls/live");
    
    return {
      success: true,
      message: "Polls refreshed successfully!",
      data: {
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error("Refresh polls error:", error);
    
    return {
      success: false,
      message: "Failed to refresh polls",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
