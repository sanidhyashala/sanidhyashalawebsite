interface PDFErrorProps {
  message?: string;
}

export default function PDFError({
  message = "Unable to load this PDF.",
}: PDFErrorProps) {
  return (
    <div className="flex h-[70vh] items-center justify-center rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-red-700 dark:text-red-400">
          PDF Error
        </h2>

        <p className="text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}