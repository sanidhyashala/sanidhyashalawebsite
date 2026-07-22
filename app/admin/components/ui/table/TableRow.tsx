import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function TableRow({
  children,
}: Props) {
  return (
    <tr
      className="
        border-t
        border-slate-200
        transition-colors

        hover:bg-slate-50

        dark:border-slate-800
        dark:hover:bg-slate-800/40
      "
    >
      {children}
    </tr>
  );
}