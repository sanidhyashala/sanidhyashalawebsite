"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import PDFToolbar from "./PDFToolbar";
import PDFLoading from "./PDFLoading";
import PDFError from "./PDFError";

import {
  saveReadingProgress,
  getReadingProgress,
} from "@/lib/readingProgress";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  title: string;
  pdfUrl: string;
}

const MAX_DESKTOP_WIDTH = 900;

export default function PDFViewer({ title, pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [initialPageLoaded, setInitialPageLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(MAX_DESKTOP_WIDTH);

  const containerRef = useRef<HTMLDivElement>(null);

  const nextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const previousPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 250));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, title]);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);

      setInitialPageLoaded((prevLoaded) => {
        if (!prevLoaded) {
          const savedPage = Number(getReadingProgress(pdfUrl)) || 1;
          const safePage = Math.min(Math.max(savedPage, 1), numPages);

          setPageNumber(safePage);
          return true;
        }
        return prevLoaded;
      });
    },
    [pdfUrl]
  );


  useEffect(() => {
  function handleResize() {
    if (!containerRef.current) return;

    if (window.innerWidth >= 768) {
      setContainerWidth(MAX_DESKTOP_WIDTH);
    } else {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }

  handleResize();   // 

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

  // Reset viewer when a different PDF is opened
  useEffect(() => {
    setNumPages(0);
    setInitialPageLoaded(false);
    setPageNumber(1);
  }, [pdfUrl]);

  // Save reading progress
  useEffect(() => {
    if (initialPageLoaded && pageNumber > 0) {
      saveReadingProgress(pdfUrl, pageNumber);
    }
  }, [pageNumber, pdfUrl, initialPageLoaded]);

  const baseWidth = Math.min(MAX_DESKTOP_WIDTH, containerWidth || MAX_DESKTOP_WIDTH);
  const pageWidth = baseWidth * (zoom / 100);
  const pixelRatio =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 2;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-10 w-full select-none">
      <div className="w-full overflow-x-auto md:overflow-x-visible mb-4 pb-1 scrollbar-none [webkit-overflow-scrolling:touch]">
        <div className="min-w-[340px] sm:min-w-full">
          <PDFToolbar
            title={title}
            currentPage={pageNumber}
            totalPages={numPages}
            onPrevious={previousPage}
            onNext={nextPage}
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onDownload={handleDownload}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white p-1.5 sm:p-6 shadow-sm w-full scrollbar-none [webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] [touch-action:auto]"
      >
        <Document
  key={pdfUrl}
  file={pdfUrl}
  loading={<PDFLoading />}
  error={<PDFError />}
  onLoadSuccess={handleDocumentLoadSuccess}
  className="flex flex-col items-center max-w-full"
>
  {numPages > 0 && initialPageLoaded && (
    <div className="flex w-full justify-center">
      <div className="transition-all duration-300 ease-out">
        <Page
          pageNumber={pageNumber}
          width={pageWidth}
          devicePixelRatio={pixelRatio}
          className="max-w-full h-auto transition-all duration-200 ease-out select-text"
          renderTextLayer
          renderAnnotationLayer
          loading={<PDFLoading />}
        />
      </div>
    </div>
  )}
</Document>
      </div>
    </div>
  );
}