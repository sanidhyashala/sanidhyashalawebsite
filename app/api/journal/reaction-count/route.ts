import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const articleSlug =
    searchParams.get("articleSlug");

  const { count } =
    await supabaseServer
      .from("reactions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("article_slug", articleSlug);

  return NextResponse.json({
    count: count || 0,
  });
}