import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";
import { ADMIN_IDS } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { comment } = await request.json();

  const { data: existingComment } =
    await supabaseServer
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

  if (!existingComment) {
    return NextResponse.json(
      { error: "Comment not found" },
      { status: 404 }
    );
  }

  const isOwner =
    existingComment.user_id === userId;

  const isAdmin =
    ADMIN_IDS.includes(userId);

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { error } =
    await supabaseServer
      .from("comments")
      .update({
        comment,
      })
      .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { data: existingComment } =
    await supabaseServer
      .from("comments")
      .select("*")
      .eq("id", id)
      .single();

  if (!existingComment) {
    return NextResponse.json(
      { error: "Comment not found" },
      { status: 404 }
    );
  }

  const isOwner =
    existingComment.user_id === userId;

  const isAdmin =
    ADMIN_IDS.includes(userId);

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { error } =
    await supabaseServer
      .from("comments")
      .delete()
      .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}