import { resend } from "@/app/lib/resend";

interface SendJournalNotificationParams {
  recipient: string;

  slug: string;

  title: string;

  description: string;

  readingTime: string;
}

export async function sendJournalNotification({
  recipient,
  slug,
  title,
  description,
  readingTime,
}: SendJournalNotificationParams) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://sanidhyashala.com"
  ).replace(/\/$/, "");

  const journalUrl = `${appUrl}/journal/${slug}`;

  const { data, error } =
    await resend.emails.send({
      from:
        "SanidhyaShala <hello@sanidhyashala.com>",

      to: recipient,

      subject: `📖 New Journal · ${title} | SanidhyaShala`,

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
A new Journal has been published 📖
</h1>

<p>
A new journal has just been published on
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
Learning grows quietly.<br/>
Take your time.<br/>
Read with curiosity.
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
margin:0;
font-size:24px;
color:#0f172a;
"
>
${title}
</h2>

<p
style="
margin-top:12px;
color:#475569;
"
>
${description}
</p>

<p
style="
margin-top:18px;
font-size:14px;
color:#64748b;
"
>
${readingTime}
</p>

</div>

<div style="margin:40px 0;">

<a
href="${journalUrl}"
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
Read Journal
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