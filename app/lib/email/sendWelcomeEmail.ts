import { resend } from "@/app/lib/resend";

interface SendWelcomeEmailParams {
  email: string;
}

export async function sendWelcomeEmail({
  email,
}: SendWelcomeEmailParams) {
  const { data, error } = await resend.emails.send({
    from: "SanidhyaShala <hello@sanidhyashala.com>",

    to: email,

    subject: "Welcome to SanidhyaShala 🌿",

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
            font-size:34px;
            color:#0f172a;
            font-weight:700;
          "
        >
          Welcome to SanidhyaShala 🌿
        </h1>

        <p style="margin-bottom:20px;">
          Thank you for becoming a part of this journey.
        </p>

        <p style="margin-bottom:20px;">
          Learning does not arrive all at once.
          It unfolds slowly—through reflection,
          thoughtful writing, meaningful conversations,
          and the quiet courage to keep asking questions.
        </p>

        <p style="margin-bottom:20px;">
          SanidhyaShala exists for learners who seek
          clarity rather than noise, understanding rather
          than memorisation, and wisdom rather than information.
        </p>

        <p style="margin-bottom:20px;">
          From time to time, you'll receive carefully chosen
          reflections, journal essays, and learning updates.
          We don't believe in filling your inbox—we believe in
          writing only when there is something truly worth reading.
        </p>

        <div style="margin:42px 0;">
          <a
            href="https://sanidhyashala.com"
            style="
              display:inline-block;
              background:#1e40af;
              color:#ffffff;
              text-decoration:none;
              padding:14px 30px;
              border-radius:999px;
              font-weight:600;
              font-size:15px;
            "
          >
            Visit SanidhyaShala
          </a>
        </div>

        <hr
          style="
            margin:44px 0 28px;
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
    margin:10px 0 0;
    font-size:18px;
    color:#0f172a;
    font-weight:700;
  "
>
  Manas
</p>

<p
  style="
    margin:2px 0 0;
    font-size:14px;
    color:#475569;
    font-weight:500;
  "
>
  Founder, SanidhyaShala
</p>

<p
  style="
    margin:10px 0 0;
    font-size:14px;
    color:#64748b;
    font-style:italic;
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