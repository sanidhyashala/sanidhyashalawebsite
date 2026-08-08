import {
  PenSquare,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";

// Temporary placeholder.
// Will be replaced by live admin activity feed in Version 2.

const activities = [
  {
    title: "Reflection submitted",
    subtitle: "Waiting for moderation",
    icon: PenSquare,
  },
  {
    title: "Journal module ready",
    subtitle: "No article published yet",
    icon: BookOpen,
  },
  {
    title: "Learning resources",
    subtitle: "No resources added",
    icon: GraduationCap,
  },
  {
    title: "Students",
    subtitle: "No registrations yet",
    icon: Users,
  },
];

export default function RecentActivity() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Recent Activity
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Latest updates across SanidhyaShala.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={index}
              className="
                flex
                items-center
                gap-4
                border-b
                border-slate-100
                p-6

                last:border-0

                dark:border-slate-800
              "
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Icon
                  size={20}
                  className="text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {activity.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {activity.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}