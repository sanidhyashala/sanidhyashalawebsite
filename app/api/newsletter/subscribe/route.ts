import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request
) {
  try {
    const { email } =
      await request.json();

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const { data: existing } =
      await supabase
        .from(
          "newsletter_subscribers"
        )
        .select("id")
        .eq(
          "email",
          normalizedEmail
        )
        .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message:
          "Already subscribed",
      });
    }

    const { error } =
      await supabase
        .from(
          "newsletter_subscribers"
        )
        .insert({
          email: normalizedEmail,
        });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message:
        "Successfully subscribed",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Failed to subscribe",
      },
      { status: 500 }
    );
  }
}