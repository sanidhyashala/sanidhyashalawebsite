import { resend } from "@/app/lib/resend";

interface SendPromptNotificationParams {
  recipient: string;

  promptTitle: string;

  promptDescription: string;
}

export async function sendPromptNotification({
  recipient,
  promptTitle,
  promptDescription,
}: SendPromptNotificationParams) {

  const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://sanidhyashala.com"
).replace(/\/$/, "");
  

  const { data, error } = await resend.emails.send({
    from: "SanidhyaShala <hello@sanidhyashala.com>",

    to: recipient,

    subject: `🌿 New Reflection · ${promptTitle} | SanidhyaShala`,

    html: `
      <div
        style="
          max-width:640px;
          margin:auto;
          padding:48px 36px;
          font-family:Arial, Helvetica, sans-serif;
          color:#334155;
          line-height:1.8;
          background:#ffffff;
        "
      >

        <h1
          style="
            margin:0 0 28px;
            font-size:32px;
            color:#0f172a;
          "
        >
          A new Reflection is waiting 🌿
        </h1>

        <p>
          A new reflection has just been published on
          <strong>SanidhyaShala</strong>.
        </p>

        <p
  style="
    margin-top:20px;
    color:#475569;
    font-style:italic;
    line-height:1.9;
  "
>
  Take a quiet moment today.<br/>
  Read slowly.<br/>
  Respond honestly.
</p>

        <div
          style="
            margin:32px 0;
            padding:24px;
            border-radius:16px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
          "
        >
          <h2
            style="
              margin:0 0 12px;
              color:#0f172a;
              font-size:22px;
            "
          >
            ${promptTitle}
          </h2>

          <p
            style="
              margin:0;
              color:#475569;
            "
          >
            ${promptDescription}
          </p>
        </div>

        <div style="margin:40px 0;">
          <a
            href="${appUrl}/reflection"
            style="
              display:inline-block;
              background:#1e40af;
              color:#ffffff;
              text-decoration:none;
              padding:14px 30px;
              border-radius:999px;
              font-weight:600;
            "
          >
            Begin Reflection
          </a>
        </div>

        <hr
          style="
            margin:40px 0;
            border:none;
            border-top:1px solid #e2e8f0;
          "
        />

        <p
          style="
            font-size:14px;
            color:#64748b;
            margin:0;
          "
        >
          With warmth,
        </p>

        <p
          style="
            margin:6px 0 0;
            font-weight:600;
            color:#0f172a;
          "
        >
          Manas
        </p>

        <p
          style="
            margin:2px 0;
            color:#64748b;
          "
        >
          Founder, SanidhyaShala
        </p>

        <p
          style="
            margin-top:6px;
            color:#64748b;
          "
        >
          From Clarity to Mastery
        </p>

      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}