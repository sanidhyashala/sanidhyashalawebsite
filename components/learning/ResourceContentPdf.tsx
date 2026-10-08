"use client";

import {
  useRef,
  useState,
  type ReactNode,
} from "react";

interface Props {
  title: string;
  subjectName: string;
  children: ReactNode;
}

/* ---------------------------------------------------------
 * Safe PDF filename
 * --------------------------------------------------------- */

function createSafeFileName(
  title: string
): string {
  const safeTitle = title
    .trim()
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ""
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${
    safeTitle || "sanidhyashala-notes"
  }.pdf`;
}

/* ---------------------------------------------------------
 * Component
 * --------------------------------------------------------- */

export default function ResourceContentPdf({
  title,
  subjectName,
  children,
}: Props) {
  const contentRef =
    useRef<HTMLDivElement>(null);

  const [generating, setGenerating] =
    useState(false);

  /* -------------------------------------------------------
   * Generate PDF
   * ------------------------------------------------------- */

  async function handleDownload() {
    if (
      !contentRef.current ||
      generating
    ) {
      return;
    }

    setGenerating(true);

    let pdfClone: HTMLDivElement | null =
      null;

    try {
      /*
       * Browser-only imports.
       *
       * Dynamic imports prevent these libraries from being
       * evaluated during Next.js/Turbopack server evaluation.
       */
      const [
        html2canvasModule,
        jsPDFModule,
      ] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const html2canvas =
        html2canvasModule.default;

      const jsPDF =
        jsPDFModule.jsPDF;

      const source =
        contentRef.current;

      /* ---------------------------------------------------
       * 1. Create an isolated clone
       * --------------------------------------------------- */

      const clone =
        source.cloneNode(
          true
        ) as HTMLDivElement;

      pdfClone = clone;

      const sourceRect =
        source.getBoundingClientRect();

      /*
       * Keep the clone out of sight while still allowing
       * the browser to calculate its real layout.
       */
      clone.style.position =
        "absolute";

      clone.style.left =
        "-100000px";

      clone.style.top =
        "0";

      clone.style.width =
        `${sourceRect.width}px`;

      clone.style.maxWidth =
        `${sourceRect.width}px`;

      clone.style.backgroundColor =
        "#ffffff";

      clone.style.margin =
        "0";

      clone.style.boxSizing =
        "border-box";

      clone.style.color =
        "#0f172a";

      clone.style.overflow =
        "visible";

      /*
       * Add the clone temporarily to the document so that
       * browser CSS/layout calculations work normally.
       */
      document.body.appendChild(
        clone
      );

      /* ---------------------------------------------------
       * 2. Remove duplicate content H1
       * --------------------------------------------------- */

      const contentHeadings =
        Array.from(
          clone.querySelectorAll<HTMLElement>(
            "h1, h2, h3, h4, h5, h6"
          )
        );

      const firstHeading =
        contentHeadings[0];

      if (
        firstHeading &&
        firstHeading.textContent
          ?.trim() ===
          title.trim()
      ) {
        firstHeading.remove();
      }

      /* ---------------------------------------------------
       * 3. Find logical block elements
       * --------------------------------------------------- */

      const blocks =
        Array.from(
          clone.children
        ).filter(
          (
            element
          ): element is HTMLElement =>
            element instanceof
            HTMLElement &&
            element.tagName.toLowerCase() !==
              "header"
        );

      let logicalBlocks =
        blocks;

      /*
       * If there is a wrapper around the actual content,
       * inspect its direct children instead.
       */
      if (
        logicalBlocks.length === 1 &&
        ![
          "P",
          "H1",
          "H2",
          "H3",
          "H4",
          "H5",
          "H6",
          "UL",
          "OL",
          "DIV",
        ].includes(
          logicalBlocks[0].tagName
        )
      ) {
        logicalBlocks =
          Array.from(
            logicalBlocks[0]
              .children
          ).filter(
            (
              element
            ): element is HTMLElement =>
              element instanceof
              HTMLElement
          );
      }

      /* ---------------------------------------------------
       * 4. Render isolated clone
       * --------------------------------------------------- */

      const canvas =
        await html2canvas(
          clone,
          {
            scale: 2,
            useCORS: true,
            backgroundColor:
              "#ffffff",
            logging: false,
            scrollX: 0,
            scrollY: 0,
          }
        );

      /* ---------------------------------------------------
       * 5. A4 dimensions
       * --------------------------------------------------- */

      const PAGE_WIDTH = 210;
      const PAGE_HEIGHT = 297;

      const MARGIN_TOP = 12;
      const MARGIN_RIGHT = 12;
      const MARGIN_BOTTOM = 12;
      const MARGIN_LEFT = 12;

      const CONTENT_WIDTH =
        PAGE_WIDTH -
        MARGIN_LEFT -
        MARGIN_RIGHT;

      const CONTENT_HEIGHT =
        PAGE_HEIGHT -
        MARGIN_TOP -
        MARGIN_BOTTOM;

      /*
       * Browser pixels → PDF millimetres.
       */
      const pxToMm =
        CONTENT_WIDTH /
        canvas.width;

      const pageHeightPx =
        CONTENT_HEIGHT /
        pxToMm;

      /* ---------------------------------------------------
       * 6. Determine safe page boundaries
       * --------------------------------------------------- */

      const cloneRect =
        clone.getBoundingClientRect();

      const blockBoundaries =
        logicalBlocks
          .map((block) => {
            const rect =
              block.getBoundingClientRect();

            return (
              rect.bottom -
              cloneRect.top
            );
          })
          .filter(
            (value) =>
              value > 0
          )
          .sort(
            (a, b) =>
              a - b
          );

      /*
       * Always include the complete canvas bottom.
       */
      if (
        blockBoundaries.length ===
          0 ||
        blockBoundaries[
          blockBoundaries.length - 1
        ] <
          canvas.height / 2
      ) {
        blockBoundaries.push(
          canvas.height
        );
      }

      /*
       * Convert browser-pixel boundaries into canvas
       * coordinates.
       *
       * html2canvas is rendered with scale=2.
       */
      const scale =
        canvas.width /
        cloneRect.width;

      const canvasBoundaries =
        blockBoundaries
          .map(
            (boundary) =>
              boundary * scale
          )
          .filter(
            (boundary) =>
              boundary > 0 &&
              boundary <
                canvas.height
          );

      /* ---------------------------------------------------
       * 7. Build page slices
       * --------------------------------------------------- */

      const pageSlices: Array<{
        start: number;
        end: number;
      }> = [];

      let currentStart = 0;

      while (
        currentStart <
        canvas.height
      ) {
        const idealEnd =
          Math.min(
            currentStart +
              pageHeightPx,
            canvas.height
          );

        /*
         * Find the latest logical block boundary that fits
         * inside the ideal page.
         */
        const safeBoundary =
          canvasBoundaries
            .filter(
              (boundary) =>
                boundary >
                  currentStart &&
                boundary <=
                  idealEnd
            )
            .pop();

        let pageEnd =
          safeBoundary ??
          idealEnd;

        /*
         * Prevent an extremely small page slice.
         */
        if (
          pageEnd -
            currentStart <
          40 * scale
        ) {
          pageEnd =
            idealEnd;
        }

        pageSlices.push({
          start: currentStart,
          end: pageEnd,
        });

        currentStart =
          pageEnd;
      }

      /* ---------------------------------------------------
       * 8. Create PDF
       * --------------------------------------------------- */

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation:
          "portrait",
        compress: true,
      });

      for (
        let index = 0;
        index <
        pageSlices.length;
        index++
      ) {
        if (index > 0) {
          pdf.addPage();
        }

        const slice =
          pageSlices[index];

        const sliceHeight =
          slice.end -
          slice.start;

        /*
         * Create a temporary canvas containing only the
         * current page's portion of the rendered document.
         */
        const pageCanvas =
          document.createElement(
            "canvas"
          );

        pageCanvas.width =
          canvas.width;

        pageCanvas.height =
          Math.ceil(
            sliceHeight
          );

        const context =
          pageCanvas.getContext(
            "2d"
          );

        if (!context) {
          throw new Error(
            "Unable to create PDF canvas."
          );
        }

        context.fillStyle =
          "#ffffff";

        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        context.drawImage(
          canvas,
          0,
          slice.start,
          canvas.width,
          sliceHeight,
          0,
          0,
          pageCanvas.width,
          sliceHeight
        );

        const imageData =
          pageCanvas.toDataURL(
            "image/png",
            1.0
          );

        const sliceHeightMm =
          sliceHeight *
          pxToMm;

        pdf.addImage(
          imageData,
          "PNG",
          MARGIN_LEFT,
          MARGIN_TOP,
          CONTENT_WIDTH,
          sliceHeightMm,
          undefined,
          "FAST"
        );
      }

      /* ---------------------------------------------------
       * 9. Download
       * --------------------------------------------------- */

      pdf.save(
        createSafeFileName(title)
      );
    } catch (error) {
      console.error(
        "Failed to generate PDF:",
        error
      );

      window.alert(
        "PDF could not be generated. Please try again."
      );
    } finally {
      /*
       * Always remove the temporary clone.
       */
      pdfClone?.remove();

      setGenerating(false);
    }
  }

  /* -------------------------------------------------------
   * UI
   * ------------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/* PDF Download Action */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownload}
          disabled={generating}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-blue-700
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {generating ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white
                  border-t-transparent
                "
              />

              Generating PDF...
            </>
          ) : (
            <>
              <span aria-hidden="true">
                ↓
              </span>

              Download PDF
            </>
          )}
        </button>
      </div>

      {/* ---------------------------------------------------
       * Actual PDF content
       * --------------------------------------------------- */}

      <div
        ref={contentRef}
        className="
          bg-white
          px-1
          py-1
          text-slate-900
        "
      >
        <header
          className="
            mb-8
            border-b
            border-slate-200
            pb-6
          "
        >
          <p
            className="
              mb-2
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-blue-700
            "
          >
            SanidhyaShala · Class IX ·{" "}
            {subjectName} · 2026–27
          </p>

          <h1
            className="
              text-3xl
              font-bold
              leading-tight
              text-blue-900
            "
          >
            {title}
          </h1>
        </header>

        {children}
      </div>
    </div>
  );
}