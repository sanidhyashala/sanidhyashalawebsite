import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  PenSquare,
  BarChart3,
} from "lucide-react";

const actions = [
  {
    title: "Moderate Reflections",
    href: "/admin/reflections",
    icon: PenSquare,
  },
  {
    title: "Write Journal",
    href: "/admin/journal",
    icon: BookOpen,
  },
  {
    title: "Learning Resources",
    href: "/admin/learning",
    icon: GraduationCap,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

export default function QuickActions() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Quick Actions
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Frequently used admin shortcuts.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="
                group
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
                transition-all
                duration-300

                hover:-translate-y-1
                hover:shadow-lg

                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Icon size={22} />
              </div>

              <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Open module
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}