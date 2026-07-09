import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const articleSlug =
      searchParams.get("slug");

    if (!articleSlug) {
      return NextResponse.json(
        {
          error:
            "Article slug required",
        },
        { status: 400 }
      );
    }

    const { data } =
      await supabase
        .from("journal_views")
        .select("views")
        .eq(
          "article_slug",
          articleSlug
        )
        .single();

    return NextResponse.json({
      views: data?.views ?? 0,
    });
  } catch {
    return NextResponse.json(
      {
        views: 0,
      },
      { status: 200 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const { articleSlug } =
      await request.json();

    if (!articleSlug) {
      return NextResponse.json(
        {
          error:
            "Article slug required",
        },
        { status: 400 }
      );
    }

    const { data: existing } =
      await supabase
        .from("journal_views")
        .select("views")
        .eq(
          "article_slug",
          articleSlug
        )
        .single();

    if (!existing) {
      const { data } =
        await supabase
          .from("journal_views")
          .insert({
            article_slug:
              articleSlug,

            views: 1,
          })
          .select()
          .single();

      return NextResponse.json({
        views: data?.views ?? 1,
      });
    }

    const newViews =
      existing.views + 1;

    await supabase
      .from("journal_views")
      .update({
        views: newViews,
      })
      .eq(
        "article_slug",
        articleSlug
      );

    return NextResponse.json({
      views: newViews,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Failed to update views",
      },
      { status: 500 }
    );
  }
}