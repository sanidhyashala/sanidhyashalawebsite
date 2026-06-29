"use client";

import { useEffect, useState } from "react";
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

export default function PDFViewer({ title, pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [initialPageLoaded, setInitialPageLoaded] = useState(false);

  function nextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }

  function previousPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function zoomIn() {
    setZoom((prev) => Math.min(prev + 25, 250));
  }

  function zoomOut() {
    setZoom((prev) => Math.max(prev - 25, 50));
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Reset viewer when a different PDF is opened
  useEffect(() => {
    setNumPages(0);
    setInitialPageLoaded(false);
  }, [pdfUrl]);

  // Save reading progress
  useEffect(() => {
    if (initialPageLoaded && pageNumber > 0) {
      saveReadingProgress(pdfUrl, pageNumber);
    }
  }, [pageNumber, pdfUrl, initialPageLoaded]);

  function handleDocumentLoadSuccess({
    numPages,
  }: {
    numPages: number;
  }) {
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
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
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

      <div className="flex justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Document
          file={pdfUrl}
          loading={<PDFLoading />}
          error={<PDFError />}
          onLoadSuccess={handleDocumentLoadSuccess}
        >
          {numPages > 0 && initialPageLoaded && (
            <Page
              pageNumber={pageNumber}
              width={900 * (zoom / 100)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          )}
        </Document>
      </div>
    </div>
  );
}