import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

import { sendWelcomeEmail } from "@/app/lib/email/sendWelcomeEmail";

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

    const { error } =
      await supabase
        .from(
          "newsletter_subscribers"
        )
        .insert({
          email: normalizedEmail,
        });

    if (error) {
      if (error.code === "23505") {
  return NextResponse.json({
    success: true,
    message:
      "You're already part of the SanidhyaShala journey 🌿",
  });
}

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Send Welcome Email
    |--------------------------------------------------------------------------
    |
    | The subscriber has already been saved successfully.
    | Even if email delivery fails, we don't want to lose
    | the subscriber.
    |
    */

    try {
      await sendWelcomeEmail({
        email: normalizedEmail,
      });
    } catch (error) {
      console.error(
        "[Newsletter] Failed to send welcome email",
        {
          email: normalizedEmail,
          error,
          time:
            new Date().toISOString(),
        }
      );
    }

    return NextResponse.json({
  success: true,
  message:
    "You're in. Welcome to SanidhyaShala. Please check your inbox for a welcome message.",
});
  } catch (error) {
    console.error(
      "[Newsletter] Subscription failed",
      {
        error,
        time:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        error:
          "Failed to subscribe",
      },
      { status: 500 }
    );
  }
}