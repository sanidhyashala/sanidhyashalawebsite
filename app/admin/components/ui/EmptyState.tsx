import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: Props) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-dashed
        border-slate-300
        bg-white
        px-8
        py-16
        text-center

        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      {icon && (
        <div
          className="
            mb-6
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-slate-100
            text-slate-500

            dark:bg-slate-800
            dark:text-slate-400
          "
        >
          {icon}
        </div>
      )}

      <h3
        className="
          text-xl
          font-semibold
          text-slate-900
          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-3
          max-w-md
          text-sm
          leading-7
          text-slate-500
        "
      >
        {description}
      </p>

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}