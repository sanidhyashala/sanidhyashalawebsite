import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const articleSlug =
    searchParams.get("articleSlug");

  const { data, error } =
    await supabaseServer
      .from("comments")
      .select("*")
      .eq("article_slug", articleSlug)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const {
    articleSlug,
    comment,
    userName,
  } = await request.json();

  const { error } =
    await supabaseServer
      .from("comments")
      .insert({
        article_slug: articleSlug,
        user_id: userId,
        user_name: userName,
        comment,
      });

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