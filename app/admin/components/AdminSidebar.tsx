"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserButton } from "@clerk/nextjs";

import {
  LayoutDashboard,
  PenSquare,
  BookOpen,
  GraduationCap,
  FileQuestion,
  Users,
  Mail,
  ChartColumn,
  Settings,
} from "lucide-react";

const navigation = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Reflections",
    href: "/admin/reflections",
    icon: PenSquare,
  },
  {
  title: "Reflection Prompts",
  href: "/admin/prompts",
  icon: PenSquare,
  },
  {
    title: "Journal",
    href: "/admin/journal",
    icon: BookOpen,
  },
  {
    title: "Learning",
    href: "/admin/learning",
    icon: GraduationCap,
  },
  {
    title: "Question Bank",
    href: "/admin/question-bank",
    icon: FileQuestion,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "Newsletter",
    href: "/admin/newsletter",
    icon: Mail,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: ChartColumn,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        flex
        h-screen
        w-[280px]
        flex-col
        border-r
        border-slate-200
        bg-white
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Logo */}

      <div className="border-b border-slate-200 px-8 py-8 dark:border-slate-800">

        <h1 className="text-xl font-bold tracking-[0.2em] text-slate-900 dark:text-white">
          SANIDHYASHALA
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Founder Dashboard
        </p>

      </div>

      {/* Navigation */}

      <nav
  className="
    flex-1
    overflow-y-auto
    px-4
    py-6

    scrollbar-thin
    scrollbar-thumb-slate-300
    dark:scrollbar-thumb-slate-700
  "
>

        {navigation.map((item) => {

          const Icon = item.icon;

          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                mb-1.5
                flex
                items-center
                gap-3
                rounded-2xl
                px-4
                py-2.5
                text-sm
                font-medium
                transition-all
                duration-200

                ${
                  active
                    ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }
              `}
            >
              <Icon size={19} />

              <span>{item.title}</span>

            </Link>
          );
        })}
      </nav>

            {/* Bottom Section */}

      <div
  className="
    shrink-0
    border-t
    border-slate-200
    p-6
    dark:border-slate-800
  "
>

        <div className="flex items-center gap-3">

          {/* 👇 Is wrapper div me flex aur alignment add kiya hai taaki UserButton hil na sake */}
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-11 w-11",
                },
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Founder
            </p>

            <p className="truncate text-xs text-slate-500">
              SanidhyaShala Admin
            </p>
          </div>

        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">

          <p className="text-center text-xs tracking-widest text-slate-400">
            VERSION 1.0
          </p>

        </div>

      </div>

    </aside>
  );
}