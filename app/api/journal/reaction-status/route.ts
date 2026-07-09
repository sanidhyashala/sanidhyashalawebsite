import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({
      reacted: false,
    });
  }

  const { searchParams } =
    new URL(request.url);

  const articleSlug =
    searchParams.get("articleSlug");

  const { data } =
    await supabaseServer
      .from("reactions")
      .select("id")
      .eq("article_slug", articleSlug)
      .eq("user_id", userId)
      .maybeSingle();

  return NextResponse.json({
    reacted: !!data,
  });
}