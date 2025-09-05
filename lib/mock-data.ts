import { Poll, PollWithResults } from "./types";

// Mock poll data for testing
export const mockPolls: Poll[] = [
  {
    id: "1",
    title: "What is your favorite programming language?",
    description:
      "Help us understand the community preferences for programming languages.",
    options: [
      { id: "1-1", poll_id: "1", text: "JavaScript", votes: 45, order: 0 },
      { id: "1-2", poll_id: "1", text: "Python", votes: 38, order: 1 },
      { id: "1-3", poll_id: "1", text: "TypeScript", votes: 32, order: 2 },
      { id: "1-4", poll_id: "1", text: "Java", votes: 28, order: 3 },
      { id: "1-5", poll_id: "1", text: "Go", votes: 15, order: 4 },
      { id: "1-6", poll_id: "1", text: "Rust", votes: 12, order: 5 },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    total_votes: 170,
    is_active: true,
  },
  {
    id: "2",
    title: "Which framework do you prefer for web development?",
    description: "Share your opinion on popular web development frameworks.",
    options: [
      { id: "2-1", poll_id: "2", text: "React", votes: 67, order: 0 },
      { id: "2-2", poll_id: "2", text: "Vue.js", votes: 34, order: 1 },
      { id: "2-3", poll_id: "2", text: "Angular", votes: 28, order: 2 },
      { id: "2-4", poll_id: "2", text: "Svelte", votes: 18, order: 3 },
      { id: "2-5", poll_id: "2", text: "Next.js", votes: 45, order: 4 },
    ],
    created_at: "2024-01-14T14:30:00Z",
    updated_at: "2024-01-14T14:30:00Z",
    total_votes: 192,
    is_active: true,
  },
  {
    id: "3",
    title: "How do you prefer to learn new technologies?",
    description:
      "Understanding learning preferences helps us create better resources.",
    options: [
      { id: "3-1", poll_id: "3", text: "Online courses", votes: 42, order: 0 },
      { id: "3-2", poll_id: "3", text: "Documentation", votes: 38, order: 1 },
      { id: "3-3", poll_id: "3", text: "Video tutorials", votes: 35, order: 2 },
      { id: "3-4", poll_id: "3", text: "Books", votes: 22, order: 3 },
      {
        id: "3-5",
        poll_id: "3",
        text: "Hands-on projects",
        votes: 48,
        order: 4,
      },
      {
        id: "3-6",
        poll_id: "3",
        text: "Community forums",
        votes: 29,
        order: 5,
      },
    ],
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
    total_votes: 214,
    is_active: true,
  },
];

// Mock function to get a poll by ID
export function getMockPoll(id: string): PollWithResults | null {
  const poll = mockPolls.find((p) => p.id === id);
  if (!poll) return null;

  // Calculate percentages
  const optionsWithPercentage = poll.options.map((option) => ({
    ...option,
    percentage:
      poll.total_votes > 0
        ? Math.round((option.votes / poll.total_votes) * 100)
        : 0,
  }));

  return {
    ...poll,
    options: optionsWithPercentage,
    user_has_voted: false,
    user_vote_option_id: undefined,
  };
}

// Mock function to get all polls
export function getAllMockPolls(): Poll[] {
  return mockPolls;
}

// Mock function to submit a vote
export function submitMockVote(
  pollId: string,
  optionId: string,
): { success: boolean; message: string } {
  const poll = mockPolls.find((p) => p.id === pollId);
  if (!poll) {
    return { success: false, message: "Poll not found" };
  }

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) {
    return { success: false, message: "Invalid option" };
  }

  // Simulate vote submission
  option.votes += 1;
  poll.total_votes += 1;
  poll.updated_at = new Date().toISOString();

  return { success: true, message: "Vote submitted successfully!" };
}
