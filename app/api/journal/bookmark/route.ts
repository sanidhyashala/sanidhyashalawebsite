import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { articleSlug } = await request.json();

  const { data: existingBookmark } =
    await supabaseServer
      .from("bookmarks")
      .select("id")
      .eq("article_slug", articleSlug)
      .eq("user_id", userId)
      .maybeSingle();

  if (existingBookmark) {
    await supabaseServer
      .from("bookmarks")
      .delete()
      .eq("id", existingBookmark.id);

    return NextResponse.json({
      bookmarked: false,
    });
  }

  await supabaseServer
    .from("bookmarks")
    .insert({
      article_slug: articleSlug,
      user_id: userId,
    });

  return NextResponse.json({
    bookmarked: true,
  });
}