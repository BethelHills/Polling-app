import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { z } from "zod";

// Validation schema for poll updates
const updatePollSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  is_active: z.boolean().optional(),
  options: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // For existing options
        text: z
          .string()
          .min(1, "Option text is required")
          .max(100, "Option must be less than 100 characters"),
        order_index: z.number().min(0).optional(),
      }),
    )
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed")
    .optional(),
});

/**
 * PUT /api/polls/[id]/manage
 * Update a poll (title, description, status, options)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pollId } = await params;
    const body = await request.json();

    // Validate the request body
    const validationResult = updatePollSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors:
            validationResult.error?.issues?.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })) || [],
        },
        { status: 400 },
      );
    }

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

    // Check if poll exists and user owns it
    const { data: poll, error: pollError } = await supabaseServerClient
      .from("polls")
      .select("id, title, description, is_active, owner_id")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 },
      );
    }

    if (poll.owner_id !== userData.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied - You can only edit your own polls",
        },
        { status: 403 },
      );
    }

    const updateData = validationResult.data;

    // Update poll basic information
    if (
      updateData.title ||
      updateData.description !== undefined ||
      updateData.is_active !== undefined
    ) {
      const { error: updateError } = await supabaseServerClient
        .from("polls")
        .update({
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.description !== undefined && {
            description: updateData.description,
          }),
          ...(updateData.is_active !== undefined && {
            is_active: updateData.is_active,
          }),
        })
        .eq("id", pollId);

      if (updateError) {
        console.error("Error updating poll:", updateError);
        return NextResponse.json(
          { success: false, message: "Failed to update poll" },
          { status: 500 },
        );
      }
    }

    // Update poll options if provided
    if (updateData.options) {
      // Get existing options
      const { data: existingOptions, error: optionsError } =
        await supabaseServerClient
          .from("poll_options")
          .select("id, text, order_index")
          .eq("poll_id", pollId)
          .order("order_index");

      if (optionsError) {
        console.error("Error fetching existing options:", optionsError);
        return NextResponse.json(
          { success: false, message: "Failed to fetch existing options" },
          { status: 500 },
        );
      }

      // Identify options to update, create, and delete
      const existingOptionIds = existingOptions.map((opt) => opt.id);
      const newOptionIds = updateData.options
        .filter((opt) => opt.id)
        .map((opt) => opt.id);
      const optionsToDelete = existingOptionIds.filter(
        (id) => !newOptionIds.includes(id),
      );
      const optionsToUpdate = updateData.options.filter(
        (opt) => opt.id && existingOptionIds.includes(opt.id),
      );
      const optionsToCreate = updateData.options.filter((opt) => !opt.id);

      // Delete removed options
      if (optionsToDelete.length > 0) {
        const { error: deleteError } = await supabaseServerClient
          .from("poll_options")
          .delete()
          .in("id", optionsToDelete);

        if (deleteError) {
          console.error("Error deleting options:", deleteError);
          return NextResponse.json(
            { success: false, message: "Failed to delete options" },
            { status: 500 },
          );
        }
      }

      // Update existing options
      for (const option of optionsToUpdate) {
        const { error: updateOptionError } = await supabaseServerClient
          .from("poll_options")
          .update({
            text: option.text,
            order_index: option.order_index || 0,
          })
          .eq("id", option.id);

        if (updateOptionError) {
          console.error("Error updating option:", updateOptionError);
          return NextResponse.json(
            { success: false, message: "Failed to update option" },
            { status: 500 },
          );
        }
      }

      // Create new options
      if (optionsToCreate.length > 0) {
        const newOptionsData = optionsToCreate.map((option, index) => ({
          poll_id: pollId,
          text: option.text,
          order_index: option.order_index || existingOptions.length + index,
          votes: 0,
        }));

        const { error: createError } = await supabaseServerClient
          .from("poll_options")
          .insert(newOptionsData);

        if (createError) {
          console.error("Error creating options:", createError);
          return NextResponse.json(
            { success: false, message: "Failed to create options" },
            { status: 500 },
          );
        }
      }
    }

    // Get updated poll data
    const { data: updatedPoll, error: fetchError } = await supabaseServerClient
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
          votes,
          order_index
        )
      `,
      )
      .eq("id", pollId)
      .single();

    if (fetchError) {
      console.error("Error fetching updated poll:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message: "Poll updated but failed to fetch updated data",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Poll updated successfully!",
        poll: updatedPoll,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in poll update API:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/polls/[id]/manage
 * Delete a poll and all its associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: pollId } = await params;

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

    // Check if poll exists and user owns it
    const { data: poll, error: pollError } = await supabaseServerClient
      .from("polls")
      .select("id, title, owner_id")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 },
      );
    }

    if (poll.owner_id !== userData.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied - You can only delete your own polls",
        },
        { status: 403 },
      );
    }

    // Delete poll (cascade will handle options and votes)
    const { error: deleteError } = await supabaseServerClient
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error deleting poll:", deleteError);
      return NextResponse.json(
        { success: false, message: "Failed to delete poll" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Poll deleted successfully!",
        deleted_poll: {
          id: pollId,
          title: poll.title,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in poll delete API:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
