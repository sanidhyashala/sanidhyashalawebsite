import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  align?: "left" | "center" | "right";
}

export default function TableCell({
  children,
  align = "left",
}: Props) {
  return (
    <td
      className={`
        px-6
        py-5
        text-sm
        text-slate-700
        dark:text-slate-300

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
    </td>
  );
}