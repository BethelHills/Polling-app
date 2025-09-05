import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { PollOption } from "@/lib/types";

/**
 * GET /api/polls/search
 * Search and filter polls with various criteria
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sort") || "created_at";
    const sortOrder = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const activeOnly = searchParams.get("active") === "true";
    const minVotes = parseInt(searchParams.get("min_votes") || "0");
    const maxVotes = parseInt(searchParams.get("max_votes") || "999999");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Validate sort parameters
    const validSortFields = [
      "created_at",
      "title",
      "total_votes",
      "vote_count",
    ];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { success: false, message: "Invalid sort field" },
        { status: 400 },
      );
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { success: false, message: "Invalid sort order" },
        { status: 400 },
      );
    }

    // Build the base query
    let supabaseQuery = supabaseServerClient.from("polls").select(`
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at,
        owner_id,
        poll_options (
          id,
          text,
          votes
        )
      `);

    // Apply filters
    if (activeOnly) {
      supabaseQuery = supabaseQuery.eq("is_active", true);
    }

    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`,
      );
    }

    if (category) {
      // Assuming you have a category field in polls table
      supabaseQuery = supabaseQuery.eq("category", category);
    }

    if (dateFrom) {
      supabaseQuery = supabaseQuery.gte("created_at", dateFrom);
    }

    if (dateTo) {
      supabaseQuery = supabaseQuery.lte("created_at", dateTo);
    }

    // Apply sorting
    if (sortBy === "total_votes" || sortBy === "vote_count") {
      // For vote-based sorting, we'll need to calculate total votes
      supabaseQuery = supabaseQuery.order("created_at", {
        ascending: sortOrder === "asc",
      });
    } else {
      supabaseQuery = supabaseQuery.order(sortBy, {
        ascending: sortOrder === "asc",
      });
    }

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    // Execute the query
    const { data: polls, error } = await supabaseQuery;

    if (error) {
      console.error("Error searching polls:", error);
      return NextResponse.json(
        { success: false, message: "Failed to search polls" },
        { status: 500 },
      );
    }

    // Process the results
    const processedPolls = polls.map((poll) => {
      const totalVotes = poll.poll_options.reduce(
        (sum: number, option: PollOption) => sum + option.votes,
        0,
      );
      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        is_active: poll.is_active,
        created_at: poll.created_at,
        updated_at: poll.updated_at,
        owner_id: poll.owner_id,
        total_votes: totalVotes,
        option_count: poll.poll_options.length,
        options: poll.poll_options.map((option: PollOption) => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
        })),
      };
    });

    // Apply vote count filters after processing
    const filteredPolls = processedPolls.filter(
      (poll) => poll.total_votes >= minVotes && poll.total_votes <= maxVotes,
    );

    // Re-sort by vote count if needed
    if (sortBy === "total_votes" || sortBy === "vote_count") {
      filteredPolls.sort((a, b) => {
        const comparison = a.total_votes - b.total_votes;
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseServerClient
      .from("polls")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting poll count:", countError);
    }

    // Get popular categories (if you have categories)
    const { data: categories } = await supabaseServerClient
      .from("polls")
      .select("category")
      .not("category", "is", null)
      .limit(10);

    const popularCategories = categories
      ? Array.from(new Set(categories.map((c) => c.category))).slice(0, 10)
      : [];

    return NextResponse.json(
      {
        success: true,
        results: {
          polls: filteredPolls,
          pagination: {
            total: count || 0,
            limit,
            offset,
            has_more: offset + limit < (count || 0),
          },
          filters: {
            query,
            category,
            sort_by: sortBy,
            sort_order: sortOrder,
            active_only: activeOnly,
            min_votes: minVotes,
            max_votes: maxVotes,
            date_from: dateFrom,
            date_to: dateTo,
          },
          popular_categories: popularCategories,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in poll search API:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/polls/search/suggestions
 * Get search suggestions and autocomplete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = "all" } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: true, suggestions: [] },
        { status: 200 },
      );
    }

    let suggestions: string[] = [];

    if (type === "all" || type === "polls") {
      // Get poll title suggestions
      const { data: pollSuggestions, error: pollError } =
        await supabaseServerClient
          .from("polls")
          .select("id, title")
          .ilike("title", `%${query}%`)
          .eq("is_active", true)
          .limit(5);

      if (!pollError && pollSuggestions) {
        suggestions = suggestions.concat(
          pollSuggestions.map((poll) => ({
            type: "poll",
            id: poll.id,
            text: poll.title,
            category: "Polls",
          })),
        );
      }
    }

    if (type === "all" || type === "categories") {
      // Get category suggestions (if you have categories)
      const { data: categorySuggestions, error: categoryError } =
        await supabaseServerClient
          .from("polls")
          .select("category")
          .ilike("category", `%${query}%`)
          .not("category", "is", null)
          .limit(3);

      if (!categoryError && categorySuggestions) {
        const uniqueCategories = Array.from(
          new Set(categorySuggestions.map((c) => c.category)),
        );
        suggestions = suggestions.concat(
          uniqueCategories.map((category) => ({
            type: "category",
            id: category,
            text: category,
            category: "Categories",
          })),
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        suggestions: suggestions.slice(0, 8), // Limit total suggestions
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in search suggestions API:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
