"use server";

import { getMockPoll, getAllMockPolls, submitMockVote } from "./mock-data";
import { Poll, PollWithResults } from "./types";
import { revalidatePath } from "next/cache";

export async function getPoll(id: string): Promise<PollWithResults | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return getMockPoll(id);
}

export async function getAllPolls(): Promise<Poll[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return getAllMockPolls();
}

export async function submitVote(
  pollId: string,
  optionId: string,
): Promise<{ success: boolean; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const result = submitMockVote(pollId, optionId);

  if (result.success) {
    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/");
  }

  return result;
}

export async function createPoll(
  formData: FormData,
): Promise<{ success: boolean; message: string; pollId?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const title = formData.get("title") as string;
  // const description = formData.get("description") as string;
  const options = formData.getAll("options") as string[];

  if (!title || options.length < 2) {
    return {
      success: false,
      message: "Title and at least 2 options are required",
    };
  }

  // For demo purposes, return a mock success
  const newPollId = Math.random().toString(36).substr(2, 9);

  revalidatePath("/");
  return {
    success: true,
    message: "Poll created successfully!",
    pollId: newPollId,
  };
}
