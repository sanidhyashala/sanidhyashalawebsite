import type { ReactNode } from "react";

interface Props {
  title?: string;

  description?: string;

  actions?: ReactNode;

  children: ReactNode;

  className?: string;
}

export default function Section({
  title,
  description,
  actions,
  children,
  className = "",
}: Props) {
  return (
    <section
      className={[
        "space-y-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || description || actions) && (
        <div
          className="
            flex
            flex-col
            gap-4

            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            {title && (
              <h2
                className="
                  text-2xl
                  font-semibold
                  tracking-tight
                  text-slate-900
                  dark:text-white
                "
              >
                {title}
              </h2>
            )}

            {description && (
              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}