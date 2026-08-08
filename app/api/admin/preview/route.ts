import { NextResponse } from "next/server";

import { parseJournalContent } from "@/app/lib/journal/parser/articleParser";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const article =
      parseJournalContent(
        body.hindi
      );

    return NextResponse.json({
      success: true,

      preview: {
        title:
          article.title,

        subtitle:
          article.subtitle,

        readingTime:
          body.readingTime,

        sections:
          article.sections,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Preview failed.",
      },
      {
        status: 400,
      }
    );
  }
}