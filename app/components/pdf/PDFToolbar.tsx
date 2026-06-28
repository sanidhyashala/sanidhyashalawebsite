interface PDFToolbarProps {
  title: string;
}

export default function PDFToolbar({
  title,
}: PDFToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

      <h1 className="font-semibold text-blue-900">
        {title}
      </h1>

      <div className="flex gap-2">

        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100">
          −
        </button>

        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100">
          +
        </button>

        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100">
          Fullscreen
        </button>

        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-100">
          Download
        </button>

      </div>

    </div>
  );
}