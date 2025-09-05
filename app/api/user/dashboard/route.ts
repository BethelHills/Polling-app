import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * GET /api/user/dashboard
 * Get user dashboard data including polls, votes, and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const { data: userData, error: userErr } =
      await supabaseServerClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    const userId = userData.user.id;

    // Get user's polls
    const { data: userPolls, error: pollsError } = await supabaseServerClient
      .from("polls")
      .select(
        `
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at,
        poll_options (
          id,
          text,
          votes
        )
      `,
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (pollsError) {
      console.error("Error fetching user polls:", pollsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch user polls" },
        { status: 500 },
      );
    }

    // Get user's votes
    const { data: userVotes, error: votesError } = await supabaseServerClient
      .from("votes")
      .select(
        `
        id,
        created_at,
        poll_id,
        option_id,
        polls!inner (
          id,
          title,
          is_active
        ),
        poll_options!inner (
          id,
          text
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (votesError) {
      console.error("Error fetching user votes:", votesError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch user votes" },
        { status: 500 },
      );
    }

    // Calculate statistics
    const totalPolls = userPolls.length;
    const activePolls = userPolls.filter((poll) => poll.is_active).length;
    const totalVotes = userPolls.reduce(
      (sum, poll) =>
        sum +
        poll.poll_options.reduce(
          (pollSum, option) => pollSum + option.votes,
          0,
        ),
      0,
    );
    const totalUserVotes = userVotes.length;

    // Get recent activity (last 10 activities)
    const recentActivities = [
      ...userPolls.slice(0, 5).map((poll) => ({
        type: "poll_created",
        id: poll.id,
        title: poll.title,
        created_at: poll.created_at,
        time_ago: getTimeAgo(poll.created_at),
      })),
      ...userVotes.slice(0, 5).map((vote) => ({
        type: "vote_cast",
        id: vote.id,
        title: `Voted on "${(vote.polls as { title?: string })?.title || "Unknown Poll"}"`,
        option: (vote.poll_options as { text?: string })?.text || "Unknown",
        created_at: vote.created_at,
        time_ago: getTimeAgo(vote.created_at),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);

    // Get poll performance metrics
    const pollPerformance = userPolls.map((poll) => {
      const pollTotalVotes = poll.poll_options.reduce(
        (sum, option) => sum + option.votes,
        0,
      );
      const pollDuration = Date.now() - new Date(poll.created_at).getTime();
      const pollDurationDays = Math.floor(pollDuration / (1000 * 60 * 60 * 24));
      const averageVotesPerDay =
        pollDurationDays > 0
          ? pollTotalVotes / pollDurationDays
          : pollTotalVotes;

      return {
        id: poll.id,
        title: poll.title,
        is_active: poll.is_active,
        total_votes: pollTotalVotes,
        option_count: poll.poll_options.length,
        created_at: poll.created_at,
        duration_days: pollDurationDays,
        average_votes_per_day: Math.round(averageVotesPerDay * 100) / 100,
        engagement_score: calculateEngagementScore(
          pollTotalVotes,
          pollDurationDays,
        ),
      };
    });

    // Get top performing polls
    const topPolls = pollPerformance
      .sort((a, b) => b.total_votes - a.total_votes)
      .slice(0, 5);

    // Get voting history by month
    const votesByMonth = userVotes.reduce(
      (acc, vote) => {
        const month = new Date(vote.created_at).toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get poll creation history by month
    const pollsByMonth = userPolls.reduce(
      (acc, poll) => {
        const month = new Date(poll.created_at).toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json(
      {
        success: true,
        dashboard: {
          user: {
            id: userId,
            email: userData.user.email,
            created_at: userData.user.created_at,
          },
          statistics: {
            total_polls: totalPolls,
            active_polls: activePolls,
            inactive_polls: totalPolls - activePolls,
            total_votes_received: totalVotes,
            total_votes_cast: totalUserVotes,
            average_votes_per_poll:
              totalPolls > 0
                ? Math.round((totalVotes / totalPolls) * 100) / 100
                : 0,
          },
          polls: {
            all: pollPerformance,
            top_performing: topPolls,
            recent: userPolls.slice(0, 5).map((poll) => ({
              id: poll.id,
              title: poll.title,
              is_active: poll.is_active,
              total_votes: poll.poll_options.reduce(
                (sum, option) => sum + option.votes,
                0,
              ),
              created_at: poll.created_at,
              time_ago: getTimeAgo(poll.created_at),
            })),
          },
          votes: {
            recent: userVotes.slice(0, 10).map((vote) => ({
              id: vote.id,
              poll_title:
                (vote.polls as { title?: string })?.title || "Unknown Poll",
              option_text:
                (vote.poll_options as { text?: string })?.text || "Unknown",
              created_at: vote.created_at,
              time_ago: getTimeAgo(vote.created_at),
            })),
            history_by_month: votesByMonth,
          },
          activity: {
            recent: recentActivities,
            polls_created_by_month: pollsByMonth,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in user dashboard API:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

// Helper function to calculate engagement score
function calculateEngagementScore(
  totalVotes: number,
  daysActive: number,
): number {
  if (daysActive === 0) return totalVotes;
  const dailyAverage = totalVotes / daysActive;
  // Score based on daily average (higher is better)
  return Math.min(100, Math.round(dailyAverage * 10));
}
