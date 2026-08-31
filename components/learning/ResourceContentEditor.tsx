"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import katex from "katex";
import "katex/dist/katex.min.css";

import {
  publishLearningResource,
  saveLearningResourceDraft,
} from "@/app/lib/admin/learning/learning-content.actions";

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

type ContentNode = {
  type: string;
  [key: string]: unknown;
};

type ResourceContentDocument = {
  type: "doc";
  content: ContentNode[];
};

interface Props {
  resourceId: string;
  initialContent: unknown;
}

const EMPTY_DOCUMENT: ResourceContentDocument = {
  type: "doc",
  content: [],
};

/* ---------------------------------------------------------
 * Document normalization
 * --------------------------------------------------------- */

function normalizeDocument(
  value: unknown
): ResourceContentDocument {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return EMPTY_DOCUMENT;
  }

  const document =
    value as Record<string, unknown>;

  if (
    document.type !== "doc" ||
    !Array.isArray(document.content)
  ) {
    return EMPTY_DOCUMENT;
  }

  return {
    type: "doc",
    content:
      document.content as ContentNode[],
  };
}

/* ---------------------------------------------------------
 * HTML escaping
 * --------------------------------------------------------- */

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------------------------------------
 * Text rendering
 * --------------------------------------------------------- */

function renderTextNode(
  node: ContentTextNode
): string {
  let html = escapeHtml(node.text);

  const marks = node.marks ?? [];

  for (const mark of marks) {
    if (mark.type === "bold") {
      html = `<strong>${html}</strong>`;
    }

    if (mark.type === "italic") {
      html = `<em>${html}</em>`;
    }
  }

  return html;
}

/* ---------------------------------------------------------
 * Math rendering
 * --------------------------------------------------------- */

function renderMath(
  latex: string,
  displayMode: boolean
): string {
  try {
    const rendered = katex.renderToString(
      latex,
      {
        displayMode,
        throwOnError: false,
        output: "htmlAndMathml",
      }
    );

    const attributeName = displayMode
      ? "data-math-block"
      : "data-math-inline";

    return displayMode
      ? `<div
          ${attributeName}="${escapeHtml(
            latex
          )}"
          contenteditable="false"
          class="my-5 overflow-x-auto"
        >${rendered}</div>`
      : `<span
          ${attributeName}="${escapeHtml(
            latex
          )}"
          contenteditable="false"
          class="mx-0.5"
        >${rendered}</span>`;
  } catch {
    /*
     * KaTeX should normally handle invalid
     * expressions because throwOnError is false.
     *
     * This fallback keeps the editor safe even
     * if something unexpected happens.
     */
    return displayMode
      ? `<div
          data-math-block="${escapeHtml(
            latex
          )}"
          contenteditable="false"
          class="my-5 overflow-x-auto text-red-600"
        >${escapeHtml(latex)}</div>`
      : `<span
          data-math-inline="${escapeHtml(
            latex
          )}"
          contenteditable="false"
          class="mx-0.5 text-red-600"
        >${escapeHtml(latex)}</span>`;
  }
}

/* ---------------------------------------------------------
 * Inline rendering
 * --------------------------------------------------------- */

function renderInlineContent(
  content: unknown
): string {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((node) => {
      if (
        !node ||
        typeof node !== "object"
      ) {
        return "";
      }

      const current =
        node as Record<string, unknown>;

      if (current.type === "text") {
        return renderTextNode(
          current as ContentTextNode
        );
      }

      if (
        current.type === "mathInline" &&
        typeof current.latex === "string"
      ) {
        return renderMath(
          current.latex,
          false
        );
      }

      if (current.type === "hardBreak") {
        return "<br />";
      }

      return renderInlineContent(
        current.content
      );
    })
    .join("");
}

/* ---------------------------------------------------------
 * List item rendering
 * --------------------------------------------------------- */

function renderListItemContent(
  content: unknown
): string {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((node) => {
      if (
        !node ||
        typeof node !== "object"
      ) {
        return "";
      }

      const current =
        node as Record<string, unknown>;

      if (current.type === "paragraph") {
        return renderInlineContent(
          current.content
        );
      }

      return renderInlineContent(
        current.content
      );
    })
    .join("");
}

/* ---------------------------------------------------------
 * Document → HTML
 * --------------------------------------------------------- */

function documentToHtml(
  document: ResourceContentDocument
) {
  return document.content
    .map((node) => {
      const content =
        Array.isArray(node.content)
          ? node.content
          : [];

      if (node.type === "heading") {
        const level =
          typeof node.level === "number"
            ? node.level
            : 2;

        return `<h${level}>${renderInlineContent(
          content
        )}</h${level}>`;
      }

      if (node.type === "mathBlock") {
        const latex =
          typeof node.latex === "string"
            ? node.latex
            : "";

        return renderMath(
          latex,
          true
        );
      }

      if (node.type === "bulletList") {
        return `<ul>${content
          .map((item) => {
            if (
              !item ||
              typeof item !== "object"
            ) {
              return "";
            }

            const itemNode =
              item as Record<string, unknown>;

            return `<li>${renderListItemContent(
              itemNode.content
            )}</li>`;
          })
          .join("")}</ul>`;
      }

      if (node.type === "orderedList") {
        return `<ol>${content
          .map((item) => {
            if (
              !item ||
              typeof item !== "object"
            ) {
              return "";
            }

            const itemNode =
              item as Record<string, unknown>;

            return `<li>${renderListItemContent(
              itemNode.content
            )}</li>`;
          })
          .join("")}</ol>`;
      }

      return `<p>${renderInlineContent(
        content
      )}</p>`;
    })
    .join("");
}

/* ---------------------------------------------------------
 * Marks
 * --------------------------------------------------------- */

function getMarks(
  element: HTMLElement
): ContentMark[] {
  const marks: ContentMark[] = [];

  let current: HTMLElement | null =
    element;

  while (current) {
    const tag =
      current.tagName.toLowerCase();

    if (
      tag === "strong" ||
      tag === "b"
    ) {
      if (
        !marks.some(
          (mark) => mark.type === "bold"
        )
      ) {
        marks.push({
          type: "bold",
        });
      }
    }

    if (
      tag === "em" ||
      tag === "i"
    ) {
      if (
        !marks.some(
          (mark) => mark.type === "italic"
        )
      ) {
        marks.push({
          type: "italic",
        });
      }
    }

    current =
      current.parentElement;
  }

  return marks;
}

function getElementMarks(
  element: HTMLElement
): ContentMark[] {
  const tag =
    element.tagName.toLowerCase();

  const marks: ContentMark[] = [];

  if (
    tag === "strong" ||
    tag === "b"
  ) {
    marks.push({
      type: "bold",
    });
  }

  if (
    tag === "em" ||
    tag === "i"
  ) {
    marks.push({
      type: "italic",
    });
  }

  return marks;
}

/* ---------------------------------------------------------
 * Inline serialization
 * --------------------------------------------------------- */

function serializeInline(
  element: HTMLElement
): ContentNode[] {
  const nodes: ContentNode[] = [];

  function walk(
    current: Node,
    inheritedMarks: ContentMark[] = []
  ) {
    if (
      current.nodeType ===
      Node.TEXT_NODE
    ) {
      /*
       * A text node that lives inside a KaTeX-rendered
       * math wrapper (katex-mathml / katex-html / the
       * annotation element) must never be extracted as
       * plain text — it belongs to the math node that
       * owns it and is captured separately below.
       */
      const insideMathWrapper =
        current.parentElement?.closest(
          "[data-math-inline], [data-math-block]"
        );

      if (insideMathWrapper) {
        return;
      }

      const text =
        current.textContent ?? "";

      if (!text) {
        return;
      }

      nodes.push({
        type: "text",
        text,
        ...(inheritedMarks.length
          ? {
              marks: inheritedMarks,
            }
          : {}),
      });

      return;
    }

    if (
      current.nodeType !==
      Node.ELEMENT_NODE
    ) {
      return;
    }

    const element =
      current as HTMLElement;

    /*
     * Math nodes must be captured before
     * looking at their rendered KaTeX children.
     */
    const inlineMath =
      element.getAttribute(
        "data-math-inline"
      );

    if (inlineMath !== null) {
      nodes.push({
        type: "mathInline",
        latex: inlineMath,
      });

      return;
    }

    const blockMath =
      element.getAttribute(
        "data-math-block"
      );

    if (blockMath !== null) {
      nodes.push({
        type: "mathBlock",
        latex: blockMath,
      });

      return;
    }

    /*
     * We're not the math wrapper itself, but we may be
     * a descendant of one (KaTeX's internal spans for
     * katex-mathml / katex-html / annotation, or a stray
     * wrapper the browser inserted around the math node).
     * Never descend into these — the wrapper node already
     * produced (or will produce) the correct mathInline /
     * mathBlock entry.
     */
    if (
      element.closest(
        "[data-math-inline], [data-math-block]"
      )
    ) {
      return;
    }

    const tag =
      element.tagName.toLowerCase();

    if (tag === "br") {
      nodes.push({
        type: "hardBreak",
      });

      return;
    }

    const marks = [
      ...inheritedMarks,
      ...getElementMarks(element),
    ];

    Array.from(
      element.childNodes
    ).forEach((child) => {
      walk(child, marks);
    });
  }

  Array.from(
    element.childNodes
  ).forEach((child) => {
    walk(child);
  });

  return nodes;
}

/* ---------------------------------------------------------
 * Lists
 * --------------------------------------------------------- */

function serializeList(
  listElement: HTMLElement
): ContentNode {
  const tag =
    listElement.tagName.toLowerCase();

  const listItems: ContentNode[] =
    Array.from(
      listElement.children
    )
      .filter(
        (child) =>
          child.tagName.toLowerCase() ===
          "li"
      )
      .map((child) => {
        const item =
          child as HTMLElement;

        const paragraphContent =
          serializeInline(item);

        return {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content:
                paragraphContent,
            },
          ],
        };
      });

  return {
    type:
      tag === "ol"
        ? "orderedList"
        : "bulletList",
    content: listItems,
  };
}

/* ---------------------------------------------------------
 * Block serialization
 * --------------------------------------------------------- */

function serializeBlock(
  element: HTMLElement
): ContentNode[] {
  const nodes: ContentNode[] = [];

  const blockMath =
    element.getAttribute(
      "data-math-block"
    );

  if (blockMath !== null) {
    nodes.push({
      type: "mathBlock",
      latex: blockMath,
    });

    return nodes;
  }

  const tag =
    element.tagName.toLowerCase();

  if (
    tag === "ul" ||
    tag === "ol"
  ) {
    nodes.push(
      serializeList(element)
    );

    return nodes;
  }

  if (
    tag === "h1" ||
    tag === "h2" ||
    tag === "h3"
  ) {
    nodes.push({
      type: "heading",
      level: Number(
        tag.substring(1)
      ),
      content:
        serializeInline(element),
    });

    return nodes;
  }

  if (tag === "p") {
    /*
     * Some browsers (notably during insertUnorderedList /
     * insertOrderedList applied on a <p>-formatted block)
     * end up nesting a real <ul>/<ol> or a math block div
     * INSIDE the <p> instead of replacing it. serializeInline
     * has no concept of block elements, so calling it directly
     * here would silently flatten the list into plain text.
     * Detect that case and recurse into the real block
     * children instead of treating this as a flat paragraph.
     */
    const nestedBlockChildren = Array.from(
      element.children
    ).filter((child) => {
      const childTag =
        child.tagName.toLowerCase();

      return (
        childTag === "ul" ||
        childTag === "ol" ||
        child.getAttribute(
          "data-math-block"
        ) !== null
      );
    });

    if (nestedBlockChildren.length > 0) {
      Array.from(
        element.children
      ).forEach((child) => {
        nodes.push(
          ...serializeBlock(
            child as HTMLElement
          )
        );
      });

      return nodes;
    }

    nodes.push({
      type: "paragraph",
      content:
        serializeInline(element),
    });

    return nodes;
  }

  /*
   * contentEditable can create wrapper divs.
   * Recursively inspect their children.
   */
  if (tag === "div") {
    const children =
      Array.from(
        element.children
      );

    if (children.length > 0) {
      children.forEach((child) => {
        nodes.push(
          ...serializeBlock(
            child as HTMLElement
          )
        );
      });

      if (
        nodes.length === 0 &&
        element.textContent?.trim()
      ) {
        nodes.push({
          type: "paragraph",
          content:
            serializeInline(element),
        });
      }

      return nodes;
    }

    if (
      element.textContent?.trim()
    ) {
      nodes.push({
        type: "paragraph",
        content:
          serializeInline(element),
      });
    }

    return nodes;
  }

  if (
    element.textContent?.trim()
  ) {
    nodes.push({
      type: "paragraph",
      content:
        serializeInline(element),
    });
  }

  return nodes;
}

/* ---------------------------------------------------------
 * Full editor serialization
 * --------------------------------------------------------- */

function serializeElement(
  element: HTMLElement
): ContentNode[] {
  const nodes: ContentNode[] = [];

  Array.from(
    element.children
  ).forEach((child) => {
    nodes.push(
      ...serializeBlock(
        child as HTMLElement
      )
    );
  });

  return nodes;
}

/* ---------------------------------------------------------
 * Component
 * --------------------------------------------------------- */

export default function ResourceContentEditor({
  resourceId,
  initialContent,
}: Props) {
  const editorRef =
    useRef<HTMLDivElement>(null);

  const selectionRef =
    useRef<Range | null>(null);

  const selectedMathRef =
    useRef<HTMLElement | null>(null);

  const [document, setDocument] =
    useState<ResourceContentDocument>(
      normalizeDocument(
        initialContent
      )
    );

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  // 👇 नया publishing state
  const [publishing, setPublishing] =
    useState(false);

  /* -------------------------------------------------------
   * Restore saved document
   * ------------------------------------------------------- */

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const nextDocument =
      normalizeDocument(
        initialContent
      );

    setDocument(nextDocument);

    editorRef.current.innerHTML =
      documentToHtml(
        nextDocument
      );

    setSaved(false);
  }, [initialContent]);

  /* -------------------------------------------------------
   * Selection handling
   * ------------------------------------------------------- */

  function rememberSelection() {
    if (!editorRef.current) {
      return;
    }

    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return;
    }

    const range =
      selection.getRangeAt(0);

    if (
      editorRef.current.contains(
        range.commonAncestorContainer
      )
    ) {
      selectionRef.current =
        range.cloneRange();
    }
  }

  function restoreSelection() {
    const range =
      selectionRef.current;

    if (!range) {
      return;
    }

    const selection =
      window.getSelection();

    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function clearMathSelection() {
    const selected =
      selectedMathRef.current;

    if (selected) {
      selected.classList.remove(
        "ring-2",
        "ring-blue-500",
        "ring-offset-2"
      );
    }

    selectedMathRef.current = null;
  }

  function selectMathElement(
    element: HTMLElement
  ) {
    clearMathSelection();

    selectedMathRef.current =
      element;

    element.classList.add(
      "ring-2",
      "ring-blue-500",
      "ring-offset-2"
    );

    editorRef.current?.focus();
  }

  /* -------------------------------------------------------
   * Standard formatting commands
   * ------------------------------------------------------- */

  function runCommand(
    command: string,
    value?: string
  ) {
    editorRef.current?.focus();

    restoreSelection();

    window.document.execCommand(
      command,
      false,
      value
    );

    handleInput();
    rememberSelection();
  }

  function setBlock(
    tag: "p" | "h1" | "h2" | "h3"
  ) {
    editorRef.current?.focus();

    restoreSelection();

    window.document.execCommand(
      "formatBlock",
      false,
      tag
    );

    handleInput();
    rememberSelection();
  }

  /* -------------------------------------------------------
   * Insert math
   * ------------------------------------------------------- */

  function insertMath(
    displayMode: boolean
  ) {
    if (!editorRef.current) {
      return;
    }

    const latex = window.prompt(
      displayMode
        ? "Enter the LaTeX formula for block mathematics:"
        : "Enter the LaTeX formula for inline mathematics:",
      displayMode
        ? "\\frac{x_1+x_2}{2}"
        : "x^2+y^2"
    );

    if (
      latex === null ||
      !latex.trim()
    ) {
      editorRef.current.focus();
      return;
    }

    const cleanLatex =
      latex.trim();

    const html = renderMath(
      cleanLatex,
      displayMode
    );

    editorRef.current.focus();

    /*
     * Restore the user's original cursor/selection
     * after the prompt has closed and before inserting
     * the mathematics.
     */
    restoreSelection();

    window.document.execCommand(
      "insertHTML",
      false,
      html
    );

    handleInput();
    rememberSelection();
    clearMathSelection();
  }

  /* -------------------------------------------------------
   * Input & Events
   * ------------------------------------------------------- */

  function deleteSelectedMath() {
    const selected = selectedMathRef.current;

    if (!selected) {
      return false;
    }

    const parent =
      selected.parentNode;

    if (!parent) {
      clearMathSelection();
      return false;
    }

    const nextSibling =
      selected.nextSibling;

    const previousSibling =
      selected.previousSibling;

    parent.removeChild(
      selected
    );

    clearMathSelection();

    /*
     * Put the caret near the deleted
     * formula so typing can continue
     * naturally.
     */
    const selection =
      window.getSelection();

    const range =
      window.document.createRange();

    if (nextSibling) {
      range.setStart(
        nextSibling,
        0
      );
      range.collapse(true);
    } else if (previousSibling) {
      range.selectNodeContents(
        previousSibling
      );
      range.collapse(false);
    } else if (
      parent.nodeType ===
      Node.ELEMENT_NODE
    ) {
      range.selectNodeContents(
        parent
      );
      range.collapse(false);
    } else {
      return true;
    }

    selection?.removeAllRanges();
    selection?.addRange(range);

    handleInput();

    return true;
  }

  function handleEditorKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (
      event.key === "Backspace" ||
      event.key === "Delete"
    ) {
      if (selectedMathRef.current) {
        event.preventDefault();

        deleteSelectedMath();

        return;
      }
    }

    if (event.key === "Escape") {
      clearMathSelection();
    }
  }

  function handleEditorClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const target =
      event.target as HTMLElement;

    const mathElement =
      target.closest(
        "[data-math-inline], [data-math-block]"
      ) as HTMLElement | null;

    if (mathElement) {
      selectMathElement(
        mathElement
      );

      return;
    }

    clearMathSelection();
  }

  function handleInput() {
    if (!editorRef.current) {
      return;
    }

    const nextDocument: ResourceContentDocument =
      {
        type: "doc",
        content:
          serializeElement(
            editorRef.current
          ),
      };

    setDocument(nextDocument);
    setSaved(false);
  }

  /* -------------------------------------------------------
   * Save & Publish
   * ------------------------------------------------------- */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editorRef.current) {
      return;
    }

    const nextDocument: ResourceContentDocument =
      {
        type: "doc",
        content:
          serializeElement(
            editorRef.current
          ),
      };

    setDocument(nextDocument);

    const formData =
      new FormData();

    formData.set(
      "resource_id",
      resourceId
    );

    formData.set(
      "content_json",
      JSON.stringify(
        nextDocument
      )
    );

    setSaving(true);
    setSaved(false);

    try {
      await saveLearningResourceDraft(
        formData
      );

      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  // 👇 नया Publish function
  async function handlePublish() {
    if (!editorRef.current) {
      return;
    }

    const currentDocument: ResourceContentDocument = {
      type: "doc",
      content: serializeElement(editorRef.current),
    };

    /*
     * Always save the current editor state
     * before publishing.
     *
     * This prevents the user from publishing
     * an older saved draft accidentally.
     */
    const saveFormData = new FormData();

    saveFormData.set("resource_id", resourceId);

    saveFormData.set(
      "content_json",
      JSON.stringify(currentDocument)
    );

    setPublishing(true);
    setSaved(false);

    try {
      await saveLearningResourceDraft(saveFormData);

      const publishFormData = new FormData();

      publishFormData.set("resource_id", resourceId);

      await publishLearningResource(publishFormData);

      setDocument(currentDocument);

      setSaved(true);
    } finally {
      setPublishing(false);
    }
  }

  /* -------------------------------------------------------
   * UI
   * ------------------------------------------------------- */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar */}

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() =>
              setBlock("h1")
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            H1
          </button>

          <button
            type="button"
            onClick={() =>
              setBlock("h2")
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            H2
          </button>

          <button
            type="button"
            onClick={() =>
              setBlock("h3")
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            H3
          </button>

          <button
            type="button"
            onClick={() =>
              setBlock("p")
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            Paragraph
          </button>

          <span className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-700" />

          <button
            type="button"
            onClick={() =>
              runCommand("bold")
            }
            className="rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-white dark:hover:bg-slate-800"
          >
            B
          </button>

          <button
            type="button"
            onClick={() =>
              runCommand("italic")
            }
            className="rounded-lg px-3 py-2 text-sm italic transition hover:bg-white dark:hover:bg-slate-800"
          >
            I
          </button>

          <button
            type="button"
            onClick={() =>
              runCommand(
                "insertUnorderedList"
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            • List
          </button>

          <button
            type="button"
            onClick={() =>
              runCommand(
                "insertOrderedList"
              )
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
          >
            1. List
          </button>

          <span className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-700" />

          <button
            type="button"
            onClick={() =>
              insertMath(false)
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
            title="Insert inline mathematics"
          >
            x² Math
          </button>

          <button
            type="button"
            onClick={() =>
              insertMath(true)
            }
            className="rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white dark:hover:bg-slate-800"
            title="Insert block mathematics"
          >
            ∑ Formula
          </button>
        </div>

        {/* Editor */}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleEditorKeyDown}
          onClick={handleEditorClick}
          onMouseUp={rememberSelection}
          onKeyUp={rememberSelection}
          onSelect={rememberSelection}
          data-placeholder="Start writing your learning content..."
          className="
            min-h-[500px]
            p-8
            outline-none
            prose
            prose-slate
            max-w-none
            dark:prose-invert
          "
        />
      </div>

      {/* Save state */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Content format: RICH_TEXT_JSON_V1
        </p>

        {/* 👇 नया Save and Publish button section */}
        <div className="flex items-center gap-3">
          {saved && !saving && !publishing && (
            <span className="text-sm font-medium text-green-600">
              Draft saved successfully.
            </span>
          )}

          <button
            type="submit"
            disabled={saving || publishing}
            className="
              rounded-xl
              bg-slate-900
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            {saving
              ? "Saving..."
              : saved
                ? "Saved"
                : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing}
            className="
              rounded-xl
              bg-blue-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}