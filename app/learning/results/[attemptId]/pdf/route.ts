import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import {
  RegisterHTMLHandler,
} from "mathjax-full/js/handlers/html.js";

import { getLearningTestResult } from "@/lib/learning/results";

export const runtime = "nodejs";

/* =========================================================
   Route Context
   ========================================================= */

type RouteContext = {
  params: Promise<{
    attemptId: string;
  }>;
};

/* =========================================================
   MathJax Setup
   ========================================================= */

const mathJaxAdaptor = liteAdaptor();

RegisterHTMLHandler(mathJaxAdaptor);

const tex = new TeX({
  packages: [
    "base",
    "ams",
    "amsmath",
    "newcommand",
    "require",
  ],
});

const svg = new SVG({
  /*
   * Keep each mathematical expression self-contained.
   * MathJax will put the glyph paths directly inside
   * the SVG instead of relying on a shared font cache.
   */
  fontCache: "none",
});

/* =========================================================
   Basic Helpers
   ========================================================= */

function cleanPdfText(
  value: string | null | undefined
): string {
  return value ?? "";
}

/* =========================================================
   XML / HTML Escape
   ========================================================= */

function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================================================
   Detect LaTeX
   ========================================================= */

function containsMath(
  value: string
): boolean {
  return (
    /\$\$[\s\S]*?\$\$/.test(value) ||
    /\$[^$\n]+?\$/.test(value) ||
    /\\\([\s\S]*?\\\)/.test(value) ||
    /\\\[[\s\S]*?\\\]/.test(value)
  );
}

/* =========================================================
   Mixed Content Parser
   ========================================================= */

type TextSegment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "math";
      value: string;
      display: boolean;
    };

function parseMixedContent(
  value: string
): TextSegment[] {
  if (!value) {
    return [];
  }

  const pattern =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;

  const parts =
    value.split(pattern);

  return parts
    .filter(Boolean)
    .map(
      (part): TextSegment => {
        /* Display math: $$ ... $$ */

        if (
          part.startsWith("$$") &&
          part.endsWith("$$")
        ) {
          return {
            type: "math",
            value: part.slice(2, -2),
            display: true,
          };
        }

        /* Inline math: $ ... $ */

        if (
          part.startsWith("$") &&
          part.endsWith("$")
        ) {
          return {
            type: "math",
            value: part.slice(1, -1),
            display: false,
          };
        }

        /* Inline math: \( ... \) */

        if (
          part.startsWith("\\(") &&
          part.endsWith("\\)")
        ) {
          return {
            type: "math",
            value: part.slice(2, -2),
            display: false,
          };
        }

        /* Display math: \[ ... \] */

        if (
          part.startsWith("\\[") &&
          part.endsWith("\\]")
        ) {
          return {
            type: "math",
            value: part.slice(2, -2),
            display: true,
          };
        }

        return {
          type: "text",
          value: part,
        };
      }
    );
}

/* =========================================================
   Extract SVG from MathJax
   ========================================================= */

function extractStandaloneSvg(
  mathMarkup: string
): string {
  const svgStart =
    mathMarkup.indexOf("<svg");

  const svgEnd =
    mathMarkup.lastIndexOf("</svg>");

  if (
    svgStart === -1 ||
    svgEnd === -1
  ) {
    throw new Error(
      `MathJax did not produce valid SVG output.`
    );
  }

  let standaloneSvg =
    mathMarkup.slice(
      svgStart,
      svgEnd +
        "</svg>".length
    );

  if (
    !standaloneSvg.includes(
      'xmlns="http://www.w3.org/2000/svg"'
    )
  ) {
    standaloneSvg =
      standaloneSvg.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
  }

  if (
    standaloneSvg.includes("xlink:") &&
    !standaloneSvg.includes(
      "xmlns:xlink="
    )
  ) {
    standaloneSvg =
      standaloneSvg.replace(
        "<svg",
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
      );
  }

  return standaloneSvg;
}

/* =========================================================
   Render Math Directly as SVG
   ========================================================= */

function renderMathToSvg(
  value: string,
  display: boolean
): string {
  const mathDocument =
    mathjax.document("", {
      InputJax: tex,
      OutputJax: svg,
    });

  const mathNode =
    mathDocument.convert(
      value,
      {
        display,
      }
    );

  const mathMarkup =
    mathJaxAdaptor.outerHTML(
      mathNode
    );

  return extractStandaloneSvg(
    mathMarkup
  );
}

/* =========================================================
   Render Mixed Text + Math to HTML
   ========================================================= */

function renderMixedContent(
  value: string
): string {
  const cleanValue =
    cleanPdfText(value);

  if (!cleanValue) {
    return "";
  }

  if (!containsMath(cleanValue)) {
    return escapeHtml(
      cleanValue
    ).replace(
      /\n/g,
      "<br />"
    );
  }

  const segments =
    parseMixedContent(
      cleanValue
    );

  return segments
    .map(
      (segment) => {
        if (
          segment.type ===
          "text"
        ) {
          return escapeHtml(
            segment.value
          ).replace(
            /\n/g,
            "<br />"
          );
        }

        const svgMarkup =
          renderMathToSvg(
            segment.value,
            segment.display
          );

        if (segment.display) {
          return `
            <span class="math-display">
              ${svgMarkup}
            </span>
          `;
        }

        return `
          <span class="math-inline">
            ${svgMarkup}
          </span>
        `;
      }
    )
    .join("");
}

/* =========================================================
   Result HTML
   ========================================================= */

function buildResultHtml(
  result: Awaited<
    ReturnType<
      typeof getLearningTestResult
    >
  >
): string {
  if (!result) {
    throw new Error(
      "Result not found."
    );
  }

  const title =
    result.resource?.title ??
    result.test?.title ??
    "MCQ Practice Result";

  const questionHtml =
    result.questions
      .map(
        (
          question,
          index
        ) => {
          const questionNumber =
            question.questionOrder ??
            index + 1;

          const optionsHtml =
            question.options
              .map(
                (option) => {
                  const isSelected =
                    option.id ===
                    question.selectedOptionId;

                  const isCorrect =
                    option.isCorrect;

                  let marker = "";

                  if (
                    isCorrect
                  ) {
                    marker =
                      `<span class="marker correct-marker">[Correct]</span>`;
                  } else if (
                    isSelected
                  ) {
                    marker =
                      `<span class="marker selected-marker">[Your Answer]</span>`;
                  }

                  return `
                    <div class="option-row">
                      ${marker}
                      <span class="option-key">
                        ${escapeHtml(
                          option.optionKey
                        )}.
                      </span>
                      <span class="option-content">
                        ${renderMixedContent(
                          option.optionText
                        )}
                      </span>
                    </div>
                  `;
                }
              )
              .join("");

          const solutionHtml =
            question.solutionText
              ? `
                <div class="detail-block solution-block">
                  <div class="detail-label">
                    Solution
                  </div>
                  <div class="detail-content">
                    ${renderMixedContent(
                      question.solutionText
                    )}
                  </div>
                </div>
              `
              : "";

          const mistakeInsightHtml =
            question.mistakeInsight &&
            question.resultStatus ===
              "INCORRECT"
              ? `
                <div class="detail-block insight-block">
                  <div class="detail-label">
                    Mistake Insight
                  </div>
                  <div class="detail-content">
                    ${renderMixedContent(
                      question.mistakeInsight
                    )}
                  </div>
                </div>
              `
              : "";

          return `
            <article class="question-card">
              
              <div class="question-number">
                Question ${questionNumber}
              </div>

              <div class="question-text">
                ${renderMixedContent(
                  question.questionText
                )}
              </div>

              <div class="options">
                ${optionsHtml}
              </div>

              <div class="answer-summary">

                <div class="answer-row">
                  <span class="answer-label">
                    Your Answer:
                  </span>

                  <span class="answer-value">
                    ${renderMixedContent(
                      question.selectedOptionText ??
                        question.answerText ??
                        "Not answered"
                    )}
                  </span>
                </div>

                <div class="answer-row">
                  <span class="answer-label">
                    Correct Answer:
                  </span>

                  <span class="answer-value">
                    ${renderMixedContent(
                      question.correctOptionText ??
                        "Not available"
                    )}
                  </span>
                </div>

              </div>

              <div class="result-row">
                <span>
                  Result:
                  <strong>
                    ${escapeHtml(
                      question.resultStatus
                    )}
                  </strong>
                </span>

                <span>
                  Marks:
                  <strong>
                    ${question.marksAwarded ?? 0}
                    /
                    ${question.marks ?? 0}
                  </strong>
                </span>
              </div>

              ${solutionHtml}

              ${mistakeInsightHtml}

            </article>
          `;
        }
      )
      .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8" />

<title>
  ${escapeHtml(title)}
  - Attempt ${escapeHtml(
    String(
      result.attemptNumber
    )
  )}
</title>

<style>

  /*
   * =======================================================
   * PAGE
   * =======================================================
   */

  @page {
    size: A4;
    margin:
      18mm
      15mm
      18mm
      15mm;
  }

  /*
   * =======================================================
   * BASE
   * =======================================================
   */

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  body {
    font-family:
      Arial,
      Helvetica,
      sans-serif;

    color: #141f33;

    font-size: 10.5pt;

    line-height: 1.5;

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /*
   * =======================================================
   * HEADER
   * =======================================================
   */

  .document-header {
    background: #edf4ff;

    padding:
      22px
      24px
      20px;

    border-radius: 10px;

    margin-bottom: 22px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .brand {
    font-size: 11px;

    font-weight: 700;

    letter-spacing: 0.8px;

    color: #0d409f;

    margin-bottom: 6px;
  }

  .document-title {
    margin: 0;

    font-size: 25px;

    line-height: 1.2;

    font-weight: 700;

    color: #081f59;
  }

  .test-title {
    margin-top: 8px;

    font-size: 14px;

    line-height: 1.4;

    font-weight: 600;

    color: #24334d;
  }

  /*
   * =======================================================
   * SUMMARY
   * =======================================================
   */

  .summary {
    border: 1px solid #d9e1ed;

    border-radius: 10px;

    padding:
      18px
      20px;

    margin-bottom: 24px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .attempt {
    font-size: 10px;

    font-weight: 700;

    color: #0d409f;

    margin-bottom: 10px;
  }

  .summary-row {
    display: flex;

    justify-content: space-between;

    gap: 20px;

    margin:
      5px
      0;
  }

  .summary-label {
    color: #5a6575;
  }

  .summary-value {
    font-weight: 700;

    color: #17233a;
  }

  /*
   * =======================================================
   * SECTION TITLE
   * =======================================================
   */

  .section-title {
    margin:
      0
      0
      14px;

    font-size: 18px;

    line-height: 1.25;

    color: #081f59;

    font-weight: 700;

    break-after: avoid;
    page-break-after: avoid;
  }

  /*
   * =======================================================
   * QUESTION CARD
   * =======================================================
   *
   * This is the most important pagination rule.
   *
   * The browser is responsible for deciding where the
   * question should move.
   */

  .question-card {
    border-bottom:
      1px solid
      #e1e6ee;

    padding:
      0
      0
      18px;

    margin-bottom: 20px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .question-number {
    color: #0d409f;

    font-size: 12px;

    font-weight: 700;

    margin-bottom: 8px;

    break-after: avoid;
    page-break-after: avoid;
  }

  /*
   * =======================================================
   * QUESTION TEXT
   * =======================================================
   */

  .question-text {
    font-size: 11pt;

    line-height: 1.55;

    margin-bottom: 13px;

    break-after: avoid;
    page-break-after: avoid;
  }

  /*
   * =======================================================
   * OPTIONS
   * =======================================================
   */

  .options {
    margin:
      0
      0
      14px;
  }

  .option-row {
    display: flex;

    align-items: baseline;

    gap: 7px;

    margin:
      8px
      0;

    padding-left: 3px;

    line-height: 1.55;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .option-key {
    min-width: 18px;

    font-weight: 600;

    flex: 0 0 auto;
  }

  .option-content {
    flex: 1 1 auto;

    min-width: 0;
  }

  .marker {
    flex: 0 0 auto;

    font-size: 8.5pt;

    font-weight: 600;
  }

  .correct-marker {
    color: #1f6b3a;
  }

  .selected-marker {
    color: #9a5b00;
  }

  /*
   * =======================================================
   * ANSWER SUMMARY
   * =======================================================
   */

  .answer-summary {
    margin-top: 12px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .answer-row {
    display: flex;

    align-items: baseline;

    gap: 10px;

    margin:
      7px
      0;

    line-height: 1.5;
  }

  .answer-label {
    font-size: 10.5pt;

    font-weight: 700;

    color: #17233a;

    flex: 0 0 auto;
  }

  .answer-value {
    font-size: 10.5pt;

    flex: 1 1 auto;

    min-width: 0;
  }

  /*
   * =======================================================
   * RESULT
   * =======================================================
   */

  .result-row {
    display: flex;

    justify-content: space-between;

    gap: 20px;

    margin-top: 10px;

    font-size: 9pt;

    color: #39465a;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  /*
   * =======================================================
   * SOLUTION / INSIGHT
   * =======================================================
   */

  .detail-block {
    margin-top: 13px;

    padding:
      10px
      12px;

    border-radius: 7px;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .solution-block {
    background: #f6f8fb;

    border-left:
      3px solid
      #7c8ba3;
  }

  .insight-block {
    background: #fff8ed;

    border-left:
      3px solid
      #d18a20;
  }

  .detail-label {
    font-size: 9pt;

    font-weight: 700;

    margin-bottom: 5px;

    color: #27354b;
  }

  .detail-content {
    font-size: 9.5pt;

    line-height: 1.5;
  }

  /*
   * =======================================================
   * MATH
   * =======================================================
   */

  .math-inline {
    display: inline-block;

    vertical-align: -0.18em;

    white-space: nowrap;

    margin:
      0
      0.08em;
  }

  .math-inline svg {
    display: inline-block;

    vertical-align: middle;

    max-width: 100%;
  }

  .math-display {
    display: block;

    text-align: center;

    margin:
      10px
      0;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .math-display svg {
    max-width: 100%;

    height: auto;
  }

  /*
   * =======================================================
   * PRINT SAFETY
   * =======================================================
   */

  h1,
  h2,
  h3,
  p {
    orphans: 3;
    widows: 3;
  }

  /*
   * Keep headings attached to their content.
   */

  .question-number,
  .question-text {
    break-after: avoid;
    page-break-after: avoid;
  }

</style>

</head>

<body>

  <header class="document-header">

    <div class="brand">
      SANIDHYASHALA
    </div>

    <h1 class="document-title">
      Practice Result
    </h1>

    <div class="test-title">
      ${escapeHtml(title)}
    </div>

  </header>

  <section class="summary">

    <div class="attempt">
      Attempt ${escapeHtml(
        String(
          result.attemptNumber
        )
      )}
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Score
      </span>

      <span class="summary-value">
        ${escapeHtml(
          String(
            result.score ?? "—"
          )
        )}
      </span>
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Percentage
      </span>

      <span class="summary-value">
        ${escapeHtml(
          result.percentage !==
            null
            ? `${result.percentage}%`
            : "—"
        )}
      </span>
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Questions
      </span>

      <span class="summary-value">
        ${result.questions.length}
      </span>
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Correct
      </span>

      <span class="summary-value">
        ${result.correctCount}
      </span>
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Incorrect
      </span>

      <span class="summary-value">
        ${result.incorrectCount}
      </span>
    </div>

    <div class="summary-row">
      <span class="summary-label">
        Unanswered
      </span>

      <span class="summary-value">
        ${result.unansweredCount}
      </span>
    </div>

  </section>

  <main>

    <h2 class="section-title">
      Question Review
    </h2>

    ${questionHtml}

  </main>

</body>
</html>
  `;
}

/* =========================================================
   Browser Launcher
   ========================================================= */

async function launchBrowser() {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  /*
   * Production / Vercel
   *
   * @sparticuz/chromium provides:
   * - args
   * - executablePath()
   *
   * We intentionally define viewport/headless ourselves
   * instead of using chromium.defaultViewport/headless,
   * because those properties are not exposed by the
   * installed package typings.
   */
  if (isProduction) {
    return puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],

      executablePath:
        await chromium.executablePath(),

      defaultViewport: {
        width: 1240,
        height: 1754,
        deviceScaleFactor: 1,
      },

      headless: true,
    });
  }

  /*
   * Local development
   *
   * Set CHROME_EXECUTABLE_PATH in .env.local if
   * Puppeteer cannot automatically find Chrome.
   */
  const executablePath =
    process.env.CHROME_EXECUTABLE_PATH;

  if (executablePath) {
    return puppeteer.launch({
      executablePath,

      headless: true,

      defaultViewport: {
        width: 1240,
        height: 1754,
        deviceScaleFactor: 1,
      },

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
  }

  /*
   * Let Puppeteer find the locally installed Chrome.
   */
  return puppeteer.launch({
    channel: "chrome",

    headless: true,

    defaultViewport: {
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    },

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });
}

/* =========================================================
   GET
   ========================================================= */

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  let browser:
    | Awaited<
        ReturnType<
          typeof launchBrowser
        >
      >
    | null = null;

  try {
    const { attemptId } =
      await params;

    /* =====================================================
       Fetch Result
       ===================================================== */

    const result =
      await getLearningTestResult(
        attemptId
      );

    if (!result) {
      return new NextResponse(
        "Result not found.",
        {
          status: 404,
        }
      );
    }

    if (
      result.status !==
      "SUBMITTED"
    ) {
      return new NextResponse(
        "PDF is available only after the attempt is submitted.",
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       Build HTML
       ===================================================== */

    const html =
      buildResultHtml(
        result
      );

    /* =====================================================
       Launch Chromium
       ===================================================== */

    browser =
      await launchBrowser();

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    });

    /* =====================================================
       Load Document
       ===================================================== */

    await page.setContent(
      html,
      {
        waitUntil:
          "domcontentloaded",
      }
    );

    /* =====================================================
       Wait for Fonts / Layout
       ===================================================== */

    await page.evaluate(
      async () => {
        if (
          document.fonts &&
          document.fonts.ready
        ) {
          await document.fonts.ready;
        }
      }
    );

    /*
     * Give Chromium one layout frame after MathJax SVG
     * has been inserted into the document.
     */
    await page.evaluate(
      () =>
        new Promise<void>(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  () =>
                    resolve()
                );
              }
            );
          }
        )
    );

    /* =====================================================
       Generate PDF
       ===================================================== */

    const pdfBytes =
      await page.pdf({
        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        displayHeaderFooter: true,

        headerTemplate:
          `<div></div>`,

        footerTemplate: `
          <div
            style="
              width: 100%;
              margin: 0 15mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8px;
              color: #667085;
            "
          >

            <span>
              SanidhyaShala | From Clarity to Mastery
            </span>

            <span>
              Page
              <span class="pageNumber"></span>
              /
              <span class="totalPages"></span>
            </span>

          </div>
        `,

        margin: {
          top: "18mm",
          right: "15mm",
          bottom: "18mm",
          left: "15mm",
        },

        timeout: 60_000,

        tagged: true,
      });

    /* =====================================================
       Safe Filename
       ===================================================== */

    const safeTitle = (
      result.resource?.title ??
      result.test?.title ??
      "sanidhyashala-result"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

    const filename =
      `${safeTitle}-attempt-${result.attemptNumber}.pdf`;

    /* =====================================================
       Response
       ===================================================== */

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Failed to generate learning result PDF:",
      error
    );

    return new NextResponse(
      error instanceof Error
        ? error.message
        : "Unknown PDF generation error.",
      {
        status: 500,
      }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error(
          "Failed to close PDF browser:",
          closeError
        );
      }
    }
  }
}