export default function PDFLoading() {
  return (
    <div className="flex h-[70vh] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-blue-700"></div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Loading PDF...
        </p>
      </div>
    </div>
  );
}