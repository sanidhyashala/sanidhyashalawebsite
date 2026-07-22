import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ActionsCell({
  children,
}: Props) {
  return (
    <div className="flex justify-end gap-2">
      {children}
    </div>
  );
}