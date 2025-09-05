"use server";

import { supabaseAdmin } from "./supabase";
import { Poll, PollWithResults, PollOption } from "./types";
import { revalidatePath } from "next/cache";

export async function getPoll(id: string): Promise<PollWithResults | null> {
  try {
    const { data: poll, error: pollError } = await supabaseAdmin
      .from("polls")
      .select(
        `
        *,
        options: poll_options (
          id,
          poll_id,
          text,
          votes,
          order
        )
      `,
      )
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (pollError || !poll) {
      return null;
    }

    // Calculate percentages and total votes
    const totalVotes = poll.options.reduce(
      (sum: number, option: PollOption) => sum + option.votes,
      0,
    );
    const optionsWithPercentage = poll.options.map((option: PollOption) => ({
      ...option,
      percentage:
        totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    }));

    return {
      ...poll,
      options: optionsWithPercentage,
      total_votes: totalVotes,
      user_has_voted: false, // We'll implement IP-based voting detection later
      user_vote_option_id: undefined,
    };
  } catch (error) {
    console.error("Error fetching poll:", error);
    return null;
  }
}

export async function getAllPolls(): Promise<Poll[]> {
  try {
    const { data: polls, error } = await supabaseAdmin
      .from("polls")
      .select(
        `
        *,
        options: poll_options (
          id,
          votes
        )
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      return [];
    }

    // Calculate total votes for each poll
    return polls.map((poll) => ({
      ...poll,
      total_votes: poll.options.reduce(
        (sum: number, option: PollOption) => sum + option.votes,
        0,
      ),
    }));
  } catch (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
}

export async function submitVote(
  pollId: string,
  optionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabaseAdmin
      .from("polls")
      .select("id, is_active")
      .eq("id", pollId)
      .eq("is_active", true)
      .single();

    if (pollError || !poll) {
      return { success: false, message: "Poll not found or inactive" };
    }

    // Check if option exists for this poll
    const { data: option, error: optionError } = await supabaseAdmin
      .from("poll_options")
      .select("id, poll_id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();

    if (optionError || !option) {
      return { success: false, message: "Invalid option for this poll" };
    }

    // For now, we'll allow multiple votes from the same IP
    // In a real app, you'd want to implement proper user authentication
    // or IP-based voting restrictions

    // Insert the vote
    const { error: voteError } = await supabaseAdmin.from("votes").insert({
      poll_id: pollId,
      option_id: optionId,
    });

    if (voteError) {
      console.error("Error submitting vote:", voteError);
      return { success: false, message: "Failed to submit vote" };
    }

    // Update the option vote count
    const { error: updateError } = await supabaseAdmin
      .from("poll_options")
      .update({ votes: (option as PollOption).votes + 1 })
      .eq("id", optionId);

    if (updateError) {
      console.error("Error updating vote count:", updateError);
      return {
        success: false,
        message: "Vote submitted but count update failed",
      };
    }

    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/");

    return { success: true, message: "Vote submitted successfully!" };
  } catch (error) {
    console.error("Error submitting vote:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function createPoll(
  formData: FormData,
): Promise<{ success: boolean; message: string; pollId?: string }> {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const options = formData.getAll("options") as string[];

    if (!title || options.length < 2) {
      return {
        success: false,
        message: "Title and at least 2 options are required",
      };
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabaseAdmin
      .from("polls")
      .insert({
        title,
        description: description || null,
        is_active: true,
      })
      .select()
      .single();

    if (pollError) {
      console.error("Error creating poll:", pollError);
      return { success: false, message: "Failed to create poll" };
    }

    // Create the poll options
    const optionsData = options
      .filter((option) => option.trim())
      .map((option, index) => ({
        poll_id: poll.id,
        text: option.trim(),
        votes: 0,
        order: index,
      }));

    const { error: optionsError } = await supabaseAdmin
      .from("poll_options")
      .insert(optionsData);

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      return { success: false, message: "Poll created but options failed" };
    }

    revalidatePath("/");
    return {
      success: true,
      message: "Poll created successfully!",
      pollId: poll.id,
    };
  } catch (error) {
    console.error("Error creating poll:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
