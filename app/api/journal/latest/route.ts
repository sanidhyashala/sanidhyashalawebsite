import { NextResponse } from "next/server";

import { loadAllJournalArticles } from "@/app/lib/journal/loader/loadAllJournalArticles";

export async function GET() {
  const posts = Object.entries(loadAllJournalArticles());

  const articles = posts.slice(0, 3).map(([slug, data]) => ({
    slug,
    title: data.meta.title,
    description: data.meta.description,
    readingTime: data.meta.readingTime,
    languages: data.meta.languages,
  }));

  return NextResponse.json(
    { articles },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}