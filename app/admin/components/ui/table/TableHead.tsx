import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function TableHead({
  children,
}: Props) {
  return (
    <thead
      className="
        bg-slate-50
        dark:bg-slate-800/50
      "
    >
      <tr>{children}</tr>
    </thead>
  );
}