import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({
      signedIn: false,
      articles: [],
    });
  }

  const { data, error } =
    await supabaseServer
      .from("bookmarks")
      .select("article_slug")
      .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      {
        signedIn: true,
        articles: [],
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    signedIn: true,

    articles:
      data?.map(
        (item) => item.article_slug
      ) || [],
  });
}