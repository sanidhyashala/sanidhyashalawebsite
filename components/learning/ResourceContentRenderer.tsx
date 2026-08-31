"use client";

import type { ReactNode } from "react";

import katex from "katex";
import "katex/dist/katex.min.css";

/* ---------------------------------------------------------
 * Content types
 * --------------------------------------------------------- */

type ContentMark = {
  type: "bold" | "italic";
};

type ContentTextNode = {
  type: "text";
  text: string;
  marks?: ContentMark[];
};

type ContentMathInlineNode = {
  type: "mathInline";
  latex: string;
};

type ContentMathBlockNode = {
  type: "mathBlock";
  latex: string;
};

type ContentHardBreakNode = {
  type: "hardBreak";
};

type ContentParagraphNode = {
  type: "paragraph";
  content?: unknown;
};

type ContentHeadingNode = {
  type: "heading";
  level?: number;
  content?: unknown;
};

type ContentListItemNode = {
  type: "listItem";
  content?: unknown;
};

type ContentListNode = {
  type: "bulletList" | "orderedList";
  content?: unknown;
};

type ContentNode =
  | ContentTextNode
  | ContentMathInlineNode
  | ContentMathBlockNode
  | ContentHardBreakNode
  | ContentParagraphNode
  | ContentHeadingNode
  | ContentListItemNode
  | ContentListNode;

type ResourceContentDocument = {
  type: "doc";
  content: ContentNode[];
};

interface Props {
  content: unknown;
}

/* ---------------------------------------------------------
 * Type guards
 * --------------------------------------------------------- */

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isContentNode(
  value: unknown
): value is ContentNode {
  return (
    isRecord(value) &&
    typeof value.type === "string"
  );
}

/*
 * Only nodes that can contain child content
 * are allowed to expose a content property.
 *
 * This keeps TypeScript from trying to access
 * .content on text/math nodes.
 */
function hasContent(
  node: ContentNode
): node is
  | ContentParagraphNode
  | ContentHeadingNode
  | ContentListItemNode
  | ContentListNode {
  return (
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "listItem" ||
    node.type === "bulletList" ||
    node.type === "orderedList"
  );
}

/* ---------------------------------------------------------
 * Document normalization
 * --------------------------------------------------------- */

function normalizeDocument(
  value: unknown
): ResourceContentDocument {
  if (!isRecord(value)) {
    return {
      type: "doc",
      content: [],
    };
  }

  if (
    value.type !== "doc" ||
    !Array.isArray(value.content)
  ) {
    return {
      type: "doc",
      content: [],
    };
  }

  return {
    type: "doc",
    content:
      value.content.filter(
        isContentNode
      ),
  };
}

/* ---------------------------------------------------------
 * Math rendering
 * --------------------------------------------------------- */

function renderMath(
  latex: string,
  displayMode: boolean
): string {
  try {
    return katex.renderToString(
      latex,
      {
        displayMode,
        throwOnError: false,
        output: "htmlAndMathml",
      }
    );
  } catch {
    return latex;
  }
}

/* ---------------------------------------------------------
 * Inline content
 * --------------------------------------------------------- */

function renderInlineContent(
  content: unknown
): ReactNode[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content.map(
    (
      node: unknown,
      index: number
    ): ReactNode => {
      if (!isRecord(node)) {
        return null;
      }

      const key =
        `inline-${index}`;

      if (
        node.type === "text"
      ) {
        const text =
          typeof node.text ===
          "string"
            ? node.text
            : "";

        const marks =
          Array.isArray(
            node.marks
          )
            ? node.marks.filter(
                (
                  mark: unknown
                ): mark is ContentMark =>
                  isRecord(mark) &&
                  (mark.type ===
                    "bold" ||
                    mark.type ===
                      "italic")
              )
            : [];

        let rendered:
          ReactNode = text;

        for (
          const mark of marks
        ) {
          if (
            mark.type === "bold"
          ) {
            rendered = (
              <strong
                key={`${key}-bold`}
              >
                {rendered}
              </strong>
            );
          }

          if (
            mark.type === "italic"
          ) {
            rendered = (
              <em
                key={`${key}-italic`}
              >
                {rendered}
              </em>
            );
          }
        }

        return (
          <span key={key}>
            {rendered}
          </span>
        );
      }

      if (
        node.type ===
          "mathInline" &&
        typeof node.latex ===
          "string"
      ) {
        return (
          <span
            key={key}
            className="
              mx-0.5
              inline-block
              align-middle
            "
            dangerouslySetInnerHTML={{
              __html: renderMath(
                node.latex,
                false
              ),
            }}
          />
        );
      }

      if (
        node.type ===
        "hardBreak"
      ) {
        return (
          <br key={key} />
        );
      }

      /*
       * Inline content can contain paragraph-like
       * wrapper nodes from list items or nested
       * structures. Narrow the node type before
       * reading .content.
       */
      if (
        isContentNode(node) &&
        hasContent(node) &&
        Array.isArray(
          node.content
        )
      ) {
        return (
          <span key={key}>
            {renderInlineContent(
              node.content
            )}
          </span>
        );
      }

      return null;
    }
  );
}

/* ---------------------------------------------------------
 * List item
 * --------------------------------------------------------- */

function renderListItem(
  item: ContentNode,
  index: number
): ReactNode {
  if (
    !isContentNode(item) ||
    item.type !== "listItem" ||
    !Array.isArray(item.content)
  ) {
    return null;
  }

  return (
    <li
      key={`item-${index}`}
    >
      {item.content.map(
        (
          child: unknown,
          childIndex: number
        ): ReactNode => {
          if (
            !isContentNode(child)
          ) {
            return null;
          }

          const childKey =
            `child-${childIndex}`;

          /*
           * A list item normally contains
           * paragraph nodes.
           */
          if (
            child.type ===
              "paragraph" &&
            Array.isArray(
              child.content
            )
          ) {
            return (
              <span
                key={childKey}
              >
                {renderInlineContent(
                  child.content
                )}
              </span>
            );
          }

          /*
           * Fallback for other content-bearing
           * nodes inside a list item.
           */
          if (
            hasContent(child) &&
            Array.isArray(
              child.content
            )
          ) {
            return (
              <span
                key={childKey}
              >
                {renderInlineContent(
                  child.content
                )}
              </span>
            );
          }

          return null;
        }
      )}
    </li>
  );
}

/* ---------------------------------------------------------
 * Main node renderer
 * --------------------------------------------------------- */

function renderNode(
  node: ContentNode,
  index: number
): ReactNode {
  const key =
    `node-${index}`;

  /* -------------------------------------------------------
   * Paragraph
   * ------------------------------------------------------- */

  if (
    node.type ===
    "paragraph"
  ) {
    return (
      <p key={key}>
        {Array.isArray(
          node.content
        )
          ? renderInlineContent(
              node.content
            )
          : null}
      </p>
    );
  }

  /* -------------------------------------------------------
   * Heading
   * ------------------------------------------------------- */

  if (
    node.type ===
    "heading"
  ) {
    const level =
      typeof node.level ===
        "number" &&
      node.level >= 1 &&
      node.level <= 6
        ? node.level
        : 2;

    const content =
      Array.isArray(
        node.content
      )
        ? renderInlineContent(
            node.content
          )
        : null;

    switch (level) {
      case 1:
        return (
          <h1 key={key}>
            {content}
          </h1>
        );

      case 2:
        return (
          <h2 key={key}>
            {content}
          </h2>
        );

      case 3:
        return (
          <h3 key={key}>
            {content}
          </h3>
        );

      case 4:
        return (
          <h4 key={key}>
            {content}
          </h4>
        );

      case 5:
        return (
          <h5 key={key}>
            {content}
          </h5>
        );

      default:
        return (
          <h6 key={key}>
            {content}
          </h6>
        );
    }
  }

  /* -------------------------------------------------------
   * Block mathematics
   * ------------------------------------------------------- */

  if (
    node.type ===
    "mathBlock"
  ) {
    const latex =
      typeof node.latex ===
        "string"
        ? node.latex
        : "";

    return (
      <div
        key={key}
        className="
          my-8
          overflow-x-auto
          py-3
          text-center
        "
        dangerouslySetInnerHTML={{
          __html: renderMath(
            latex,
            true
          ),
        }}
      />
    );
  }

  /* -------------------------------------------------------
   * Lists
   * ------------------------------------------------------- */

  if (
    node.type ===
      "bulletList" ||
    node.type ===
      "orderedList"
  ) {
    const items =
      Array.isArray(
        node.content
      )
        ? node.content
        : [];

    const renderedItems =
      items.map(
        (
          item: unknown,
          itemIndex: number
        ): ReactNode => {
          if (
            !isContentNode(item)
          ) {
            return null;
          }

          return renderListItem(
            item,
            itemIndex
          );
        }
      );

    if (
      node.type ===
      "orderedList"
    ) {
      return (
        <ol key={key}>
          {renderedItems}
        </ol>
      );
    }

    return (
      <ul key={key}>
        {renderedItems}
      </ul>
    );
  }

  return null;
}

/* ---------------------------------------------------------
 * Component
 * --------------------------------------------------------- */

export default function ResourceContentRenderer({
  content,
}: Props) {
  const document =
    normalizeDocument(
      content
    );

  return (
    <article
      className="
        prose
        prose-slate
        max-w-none
        prose-headings:font-semibold
        prose-p:leading-8
        prose-li:leading-8
        prose-h1:text-3xl
        prose-h2:text-2xl
        prose-h3:text-xl
        dark:prose-invert
      "
    >
      {document.content.map(
        (
          node: ContentNode,
          index: number
        ) =>
          renderNode(
            node,
            index
          )
      )}
    </article>
  );
}