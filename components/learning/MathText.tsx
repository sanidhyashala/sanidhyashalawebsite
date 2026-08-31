"use client";

import { useMemo } from "react";
import katex from "katex";

import "katex/dist/katex.min.css";

interface MathTextProps {
  value: string;
  className?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMixedContent(value: string): string {
  if (!value) {
    return "";
  }

  /*
   * IMPORTANT:
   * $$ ... $$ must be checked before
   * $ ... $.
   */
  const pattern =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;

  const parts = value.split(pattern);

  return parts
    .map((part) => {
      if (!part) {
        return "";
      }

      /* Display math: $$ ... $$ */
      if (
        part.startsWith("$$") &&
        part.endsWith("$$")
      ) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(
            expression,
            {
              displayMode: true,
              throwOnError: false,
              strict: "warn",
              trust: false,
            }
          );
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /* Inline math: $ ... $ */
      if (
        part.startsWith("$") &&
        part.endsWith("$")
      ) {
        const expression = part.slice(1, -1);

        try {
          return katex.renderToString(
            expression,
            {
              displayMode: false,
              throwOnError: false,
              strict: "warn",
              trust: false,
            }
          );
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /* Inline math: \( ... \) */
      if (
        part.startsWith("\\(") &&
        part.endsWith("\\)")
      ) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(
            expression,
            {
              displayMode: false,
              throwOnError: false,
              strict: "warn",
              trust: false,
            }
          );
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /* Display math: \[ ... \] */
      if (
        part.startsWith("\\[") &&
        part.endsWith("\\]")
      ) {
        const expression = part.slice(2, -2);

        try {
          return katex.renderToString(
            expression,
            {
              displayMode: true,
              throwOnError: false,
              strict: "warn",
              trust: false,
            }
          );
        } catch {
          return `<span class="text-red-500">${escapeHtml(
            part
          )}</span>`;
        }
      }

      /* Plain text */
      return escapeHtml(part).replace(
        /\n/g,
        "<br />"
      );
    })
    .join("");
}

export default function MathText({
  value,
  className = "",
}: MathTextProps) {
  const rendered = useMemo(
    () => renderMixedContent(value),
    [value]
  );

  return (
    <div
      className={`
        text-slate-900
        dark:text-slate-100
        ${className}
      `}
      dangerouslySetInnerHTML={{
        __html: rendered,
      }}
    />
  );
}