import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function DataTable({
  children,
}: Props) {
  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-sm

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {children}
        </table>
      </div>
    </div>
  );
}