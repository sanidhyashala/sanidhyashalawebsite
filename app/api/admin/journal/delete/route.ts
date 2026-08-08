import { NextResponse } from "next/server";

import { deleteJournal } from "@/app/lib/journal/services/deleteJournal";

export async function POST(request: Request) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    await deleteJournal(slug);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}