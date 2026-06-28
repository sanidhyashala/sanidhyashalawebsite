"use client";

import { useState } from "react";

import { Document, Page, pdfjs } from "react-pdf";

import PDFToolbar from "./PDFToolbar";
import PDFLoading from "./PDFLoading";
import PDFError from "./PDFError";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  title: string;
  pdfUrl: string;
}

export default function PDFViewer({
  title,
  pdfUrl,
}: PDFViewerProps) {

  const [numPages, setNumPages] = useState<number>(0);

  return (

    <div className="mx-auto max-w-6xl px-6 py-10">

      <PDFToolbar title={title} />

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <Document
          file={pdfUrl}
          loading={<PDFLoading />}
          error={<PDFError />}
          onLoadSuccess={({ numPages }) =>
            setNumPages(numPages)
          }
        >

          <Page
            pageNumber={1}
            width={900}
          />

        </Document>

      </div>

      <p className="mt-4 text-center text-sm text-slate-500">

        Total Pages : {numPages}

      </p>

    </div>

  );

}