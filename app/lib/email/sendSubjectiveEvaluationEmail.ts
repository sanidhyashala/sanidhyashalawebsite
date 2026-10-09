import { resend } from "@/app/lib/resend";

type SendSubjectiveEvaluationEmailParams = {
  to: string;
  studentName?: string | null;
  setTitle: string;
  attemptId: string;
  finalMarks: number;
  maxMarks: number;
};

type SendSubjectiveEvaluationEmailResult =
  | {
      success: true;
      id?: string;
    }
  | {
      success: false;
      error: string;
    };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://sanidhyashala.com"
  );
}

export async function sendSubjectiveEvaluationEmail({
  to,
  studentName,
  setTitle,
  attemptId,
  finalMarks,
  maxMarks,
}: SendSubjectiveEvaluationEmailParams): Promise<SendSubjectiveEvaluationEmailResult> {
  try {
    const normalizedEmail = to.trim();

    if (!normalizedEmail) {
      return {
        success: false,
        error: "Student email address is required.",
      };
    }

    const normalizedAttemptId = attemptId.trim();

    if (!normalizedAttemptId) {
      return {
        success: false,
        error: "Subjective attempt ID is required.",
      };
    }

    const safeStudentName =
      studentName?.trim() || "Student";

    const safeSetTitle =
      setTitle?.trim() || "Subjective Evaluation";

    const reviewUrl =
      `${getAppUrl()}/learning/subjective/evaluations/${encodeURIComponent(
        normalizedAttemptId,
      )}`;

    const firstName =
      safeStudentName
        .split(/\s+/)
        .filter(Boolean)[0] || "Student";

    const { data, error } =
      await resend.emails.send({
        from: "SanidhyaShala <hello@sanidhyashala.com>",

        to: [normalizedEmail],

        subject:
          "A Moment to Look Back at Your Learning",

        html: `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>
                A Moment to Look Back at Your Learning
              </title>
            </head>

            <body
              style="
                margin: 0;
                padding: 0;
                background: #f8fafc;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
                color: #0f172a;
              "
            >
              <div
                style="
                  max-width: 640px;
                  margin: 0 auto;
                  padding: 40px 20px;
                "
              >

                <div
                  style="
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    overflow: hidden;
                  "
                >

                  <div
                    style="
                      padding: 28px 32px;
                      background: #1e40af;
                      color: #ffffff;
                    "
                  >
                    <div
                      style="
                        font-size: 22px;
                        font-weight: 700;
                        letter-spacing: -0.3px;
                      "
                    >
                      सान्निध्यशाला
                    </div>

                    <div
                      style="
                        margin-top: 6px;
                        font-size: 13px;
                        opacity: 0.9;
                      "
                    >
                      From Clarity to Mastery
                    </div>
                  </div>

                  <div style="padding: 32px;">

                    <p
                      style="
                        margin: 0;
                        font-size: 16px;
                        line-height: 1.6;
                      "
                    >
                      Hello ${escapeHtml(firstName)},
                    </p>

                    <h1
                      style="
                        margin: 18px 0 12px;
                        font-size: 25px;
                        line-height: 1.3;
                        color: #0f172a;
                      "
                    >
                      Your work has now been carefully reviewed.
                    </h1>

                    <p
                      style="
                        margin: 0;
                        font-size: 15px;
                        line-height: 1.7;
                        color: #475569;
                      "
                    >
                      Your teacher has completed reviewing your
                      submitted work.
                    </p>

                    <p
                      style="
                        margin: 20px 0 0;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #475569;
                      "
                    >
                      This is not simply a result to look at,
                      but an opportunity to look back at your
                      own learning.
                    </p>

                    <p
                      style="
                        margin: 18px 0 0;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #475569;
                      "
                    >
                      Every solution you write tells something
                      about the way you understand, think, and
                      approach a problem. Your checked copy,
                      teacher's feedback, and ideal solutions
                      are now available for you to revisit.
                    </p>

                    <p
                      style="
                        margin: 18px 0 0;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #475569;
                      "
                    >
                      Take a little time with them. Notice not
                      only where you were right or where you
                      went wrong, but <strong>why</strong>.
                    </p>

                    <div
                      style="
                        margin: 24px 0 0;
                        padding: 18px 20px;
                        border-left: 3px solid #1e40af;
                        background: #f8fafc;
                        border-radius: 4px 10px 10px 4px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 15px;
                          line-height: 1.8;
                          color: #334155;
                          font-style: italic;
                        "
                      >
                        A mistake understood is often more
                        valuable than an answer remembered.
                      </p>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        padding: 20px;
                        border: 1px solid #dbeafe;
                        border-radius: 14px;
                        background: #eff6ff;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 13px;
                          color: #64748b;
                        "
                      >
                        Your evaluation
                      </p>

                      <p
                        style="
                          margin: 5px 0 16px;
                          font-size: 17px;
                          font-weight: 700;
                          color: #1e3a8a;
                        "
                      >
                        ${escapeHtml(safeSetTitle)}
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          line-height: 1.6;
                          color: #475569;
                        "
                      >
                        Your marks and evaluation are available
                        along with the complete checked copy and
                        feedback.
                      </p>
                    </div>

                    <p
                      style="
                        margin: 24px 0 0;
                        font-size: 15px;
                        line-height: 1.8;
                        color: #475569;
                      "
                    >
                      When you are ready, return to your learning
                      dashboard and spend a few quiet moments
                      with your work.
                    </p>

                    <div
                      style="
                        margin-top: 28px;
                        text-align: center;
                      "
                    >
                      <a
                        href="${reviewUrl}"
                        style="
                          display: inline-block;
                          padding: 13px 24px;
                          border-radius: 10px;
                          background: #1e40af;
                          color: #ffffff;
                          text-decoration: none;
                          font-size: 14px;
                          font-weight: 700;
                        "
                      >
                        Review My Evaluation
                      </a>
                    </div>

                    <p
                      style="
                        margin: 28px 0 0;
                        font-size: 14px;
                        line-height: 1.8;
                        color: #64748b;
                        text-align: center;
                        font-style: italic;
                      "
                    >
                      Learning becomes deeper when we pause,
                      look again, and understand.
                    </p>

                    <div
                      style="
                        margin-top: 22px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 13px;
                          line-height: 1.6;
                          color: #64748b;
                        "
                      >
                        With thoughtful wishes,
                      </p>

                      <p
                        style="
                          margin: 4px 0 0;
                          font-size: 14px;
                          font-weight: 600;
                          color: #334155;
                        "
                      >
                        SanidhyaShala
                      </p>

                      <p
                        style="
                          margin: 2px 0 0;
                          font-size: 12px;
                          color: #94a3b8;
                        "
                      >
                        From Clarity to Mastery
                      </p>
                    </div>

                  </div>
                </div>

                <p
                  style="
                    margin: 20px 0 0;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                  "
                >
                  © ${new Date().getFullYear()}
                  SanidhyaShala
                </p>

              </div>
            </body>
          </html>
        `,

        text: `
Hello ${safeStudentName},

Your work has now been carefully reviewed.

Your teacher has completed reviewing your submitted work.

This is not simply a result to look at, but an opportunity to look back at your own learning.

Every solution you write tells something about the way you understand, think, and approach a problem. Your checked copy, teacher's feedback, and ideal solutions are now available for you to revisit.

Take a little time with them. Notice not only where you were right or where you went wrong, but why.

A mistake understood is often more valuable than an answer remembered.

Your evaluation:
${safeSetTitle}

Your marks and evaluation are available along with the complete checked copy and feedback.

When you are ready, return to your learning dashboard and spend a few quiet moments with your work.

Review My Evaluation:
${reviewUrl}

Learning becomes deeper when we pause, look again, and understand.

With thoughtful wishes,
SanidhyaShala
From Clarity to Mastery
        `.trim(),
      });

    if (error) {
      console.error(
        "Resend failed for Subjective evaluation email:",
        error,
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to send Subjective evaluation email.",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective evaluation email error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to send Subjective evaluation email.",
    };
  }
}
