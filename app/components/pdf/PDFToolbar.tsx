"use client";

interface PDFToolbarProps {
  title: string;

  currentPage: number;

  totalPages: number;

  onPrevious: () => void;

  onNext: () => void;

  zoom: number;

  onZoomIn: () => void;

  onZoomOut: () => void;

  onDownload: () => void;
}

export default function PDFToolbar({
  title,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  zoom,
  onZoomIn,
  onZoomOut,
  onDownload,
}: PDFToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages || "--"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">

        <button
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1">

          <button
            onClick={onZoomOut}
            className="px-2 text-lg hover:text-blue-700"
          >
            −
          </button>

          <span className="min-w-[60px] text-center text-sm font-medium">
            {zoom}%
          </span>

          <button
            onClick={onZoomIn}
            className="px-2 text-lg hover:text-blue-700"
          >
            +
          </button>

        </div>

        <button
          onClick={onDownload}
          className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
        >
          📥 Download
        </button>

        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </button>

      </div>

    </div>
  );
}