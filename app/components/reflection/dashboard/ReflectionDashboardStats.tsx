interface Props {
  pending: number;
  published: number;
  rejected: number;
  archived: number;
}

export default function ReflectionDashboardStats({
  pending,
  published,
  rejected,
  archived,
}: Props) {
  const stats = [
    {
      label: "Pending",
      value: pending,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Published",
      value: published,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Archived",
      value: archived,
      color: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <section className="mt-12">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6

              shadow-sm

              transition-all
              duration-300

              hover:-translate-y-1
              hover:border-blue-200
              hover:shadow-xl
              hover:shadow-blue-500/10

              dark:border-slate-800
              dark:bg-slate-900
              dark:hover:border-blue-700/40
              dark:hover:shadow-blue-900/20
            "
          >
            <p
              className="
                text-sm
                font-medium
                uppercase
                tracking-wide

                text-slate-500
                dark:text-slate-400
              "
            >
              {stat.label}
            </p>

            <h2
              className={`
                mt-4
                text-5xl
                font-bold

                ${stat.color}
              `}
            >
              {stat.value}
            </h2>
          </div>
        ))}
      </div>
    </section>
  );
}