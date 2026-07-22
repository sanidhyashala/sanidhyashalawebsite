import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  align?: "left" | "center" | "right";
}

export default function TableHeader({
  children,
  align = "left",
}: Props) {
  return (
    <th
      className={`
        px-6
        py-4
        text-xs
        font-semibold
        uppercase
        tracking-wider
        text-slate-500

        ${
          align === "center"
            ? "text-center"
            : align === "right"
            ? "text-right"
            : "text-left"
        }
      `}
    >
      {children}
    </th>
  );
}