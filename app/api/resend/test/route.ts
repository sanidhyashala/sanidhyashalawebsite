import { NextResponse } from "next/server";

import { resend } from "@/app/lib/resend";

export async function GET() {
  try {
    const { data, error } =
      await resend.emails.send({
        from:
          "SanidhyaShala <hello@sanidhyashala.com>",

        to: [
          "manasmishra600450@gmail.com",
        ],

        subject:
          "SanidhyaShala Email Infrastructure is Live 🎉",

        html: `
          <h2>Hello Bandhu 👋</h2>

          <p>
            Congratulations!
          </p>

          <p>
            Your Resend integration is working successfully.
          </p>

          <p>
            This is the first production email sent from
            <strong>SanidhyaShala</strong>.
          </p>
        `,
      });

    if (error) {
      return NextResponse.json(
        error,
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}