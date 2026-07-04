"use client";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
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
    <div className="sticky top-16 md:top-[72px] z-30 mb-5 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      {/* Header */}
      <div className="mb-4">
        <h1 className="truncate text-lg font-bold text-slate-900 md:text-xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">
            {totalPages || "--"}
          </span>
        </p>
      </div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 md:flex-nowrap md:justify-between">
        {/* Navigation */}
        <div className="flex w-full gap-3 md:w-auto md:flex-1">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentPage <= 1}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={currentPage >= totalPages}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
        {/* Zoom + Download wrapper */}
        <div className="flex w-full gap-3 md:w-auto md:flex-none">
          {/* Zoom */}
          <div className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 md:flex-none">
            <button
              type="button"
              onClick={onZoomOut}
              className="flex h-11 w-11 shrink-0 items-center justify-center transition hover:bg-slate-100"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[64px] text-center text-sm font-semibold">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="flex h-11 w-11 shrink-0 items-center justify-center transition hover:bg-slate-100"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          {/* Download */}
          <button
            type="button"
            onClick={onDownload}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-700 transition hover:bg-blue-50 md:flex-none"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}