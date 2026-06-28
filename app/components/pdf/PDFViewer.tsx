"use client";

import PDFToolbar from "./PDFToolbar";
import PDFLoading from "./PDFLoading";

interface PDFViewerProps {
  title: string;
  pdfUrl: string;
}

export default function PDFViewer({
  title,
  pdfUrl,
}: PDFViewerProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">

      <PDFToolbar title={title} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <PDFLoading />

        <p className="mt-6 text-center text-sm text-slate-500">
          PDF URL:
          <br />
          {pdfUrl}
        </p>

      </div>

    </div>
  );
}