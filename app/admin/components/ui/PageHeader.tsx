import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: Props) {
  return (
    <div
      className="
        mb-10
        flex
        flex-col
        gap-6

        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <div>
        <h1
          className="
            text-4xl
            font-bold
            tracking-tight

            text-slate-900
            dark:text-white
          "
        >
          {title}
        </h1>

        {description && (
          <p
            className="
              mt-2
              max-w-2xl
              text-slate-500
            "
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          {actions}
        </div>
      )}
    </div>
  );
}