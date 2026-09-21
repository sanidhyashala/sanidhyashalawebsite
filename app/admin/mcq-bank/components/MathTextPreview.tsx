"use client";

import { useMemo } from "react";
import katex from "katex";

import "katex/dist/katex.min.css";

interface MathTextPreviewProps {
  value: string;
  className?: string;
}

/*
 * Renders mixed plain text + LaTeX.
 *
 * Supported:
 *
 * Inline:
 *   $x^2$
 *   \(x^2+y^2\)
 *
 * Display:
 *   $$\int_0^1 x^2\,dx$$
 *   \[x^2+y^2\]
 *
 * Plain text remains plain text.
 */

function renderMixedContent(value: string): string {
  if (!value) {
    return "";
  }

  /*
   * Escape HTML first so plain text cannot inject HTML.
   */
  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  /*
   * Detect the supported LaTeX delimiters.
   *
   * IMPORTANT:
   * Longer delimiters are checked before shorter ones.
   *
   * $$ ... $$
   * $ ... $
   * \( ... \)
   * \[ ... \]
   */
  const pattern =
    /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;

  const parts = value.split(pattern);

  return parts
    .map((part) => {
      if (!part) {
        return "";
      }

      /*
       * Display math: $$ ... $$
       */
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(expression, {
            displayMode: true,
            throwOnError: false,
            strict: "warn",
            trust: false,
          });
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /*
       * Inline math: $ ... $
       */
      if (part.startsWith("$") && part.endsWith("$")) {
        const expression = part.slice(1, -1);

        try {
          return katex.renderToString(expression, {
            displayMode: false,
            throwOnError: false,
            strict: "warn",
            trust: false,
          });
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /*
       * Inline math: \( ... \)
       */
      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(expression, {
            displayMode: false,
            throwOnError: false,
            strict: "warn",
            trust: false,
          });
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /*
       * Display math: \[ ... \]
       */
      if (part.startsWith("\\[") && part.endsWith("\\]")) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(expression, {
            displayMode: true,
            throwOnError: false,
            strict: "warn",
            trust: false,
          });
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /*
       * Normal text.
       */
      return escapeHtml(part).replace(/\n/g, "<br />");
    })
    .join("");
}

export default function MathTextPreview({
  value,
  className = "",
}: MathTextPreviewProps) {
  const rendered = useMemo(
    () => renderMixedContent(value),
    [value]
  );

  if (!value.trim()) {
    return (
      <div
        className={`
          text-sm
          italic
          text-slate-400
          ${className}
        `}
      >
        Mathematical preview will appear here.
      </div>
    );
  }

  return (
    <div
      className={`
        text-sm
        leading-7
        text-slate-800
        dark:text-slate-200
        ${className}
      `}
      dangerouslySetInnerHTML={{
        __html: rendered,
      }}
    />
  );
}