import { NextResponse } from "next/server";

import { supabaseServer } from "@/app/lib/reflection/supabase/server";

import { promptRepository } from "@/app/lib/prompt/supabase/prompt.supabase";

import { sendPromptNotification } from "@/app/lib/email/sendPromptNotification";

import { requireAdmin } from "@/app/lib/auth/admin";

export async function POST(
  request: Request
) {
  const body = await request
    .json()
    .catch(() => ({}));

  const resend =
    body.resend === true;

  await requireAdmin();

  try {
    /*
    |----------------------------------------------------------
    | Active Prompt
    |----------------------------------------------------------
    */

    const prompt =
      await promptRepository.getActive();

    /*
    |----------------------------------------------------------
    | Prevent Duplicate Notification
    |----------------------------------------------------------
    */

    if (
  prompt.notificationSentAt &&
  !resend
) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Community has already been notified.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |----------------------------------------------------------
    | Newsletter Subscribers
    |----------------------------------------------------------
    */

    const {
      data: subscribers,
      error,
    } = await supabaseServer
      .from("newsletter_subscribers")
      .select("email");

    if (error) {
      throw error;
    }

    if (
      !subscribers ||
      subscribers.length === 0
    ) {
      return NextResponse.json({
        success: true,
        message:
          "No subscribers found.",
      });
    }

    /*
    |----------------------------------------------------------
    | Send Emails
    |----------------------------------------------------------
    */

    let delivered = 0;

    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        await sendPromptNotification({
          recipient:
            subscriber.email,

          promptTitle:
            prompt.title,

          promptDescription:
            prompt.description,
        });

        await new Promise((resolve) =>
  setTimeout(resolve, 150)
);

        delivered++;
      } catch (error) {
        failed++;

        console.error(
          "[Notify Community] Email Failed",
          {
            email:
              subscriber.email,
            error,
          }
        );
      }
    }

    /*
    |----------------------------------------------------------
    | Mark Notification Sent
    |----------------------------------------------------------
    */

    await promptRepository.markNotificationSent(
  prompt.id,
  subscribers.length,
  delivered,
  failed
);

    /*
    |----------------------------------------------------------
    | Response
    |----------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      message:
    "Community notified successfully.",


      recipients:
        subscribers.length,

      delivered,

      failed,

      sentAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[Notify Community]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to notify community.",
      },
      {
        status: 500,
      }
    );
  }
}