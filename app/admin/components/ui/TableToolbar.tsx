import type { ReactNode } from "react";

interface Props {
  left: ReactNode;
  right?: ReactNode;
}

export default function TableToolbar({
  left,
  right,
}: Props) {
  return (
    <div
      className="
        mb-6
        flex
        flex-col
        gap-4

        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <div className="flex-1">
        {left}
      </div>

      {right && (
        <div>
          {right}
        </div>
      )}
    </div>
  );
}