"use client";

import { useEffect, useMemo, useState } from "react";

import { Bell, Search } from "lucide-react";

import { UserButton } from "@clerk/nextjs";

interface Props {
  firstName?: string | null;
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";

  return "Good Night";
}

export default function AdminHeader({
  firstName,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setNow(new Date());
    };

    updateTime();

    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    if (!now) return "Welcome";
    return getGreeting(now.getHours());
  }, [now]);

  const formattedDate = useMemo(() => {
    if (!now) return "--";

    return now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [now]);

  const formattedTime = useMemo(() => {
    if (!now) return "--:--";

    return now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [now]);

  return (
    <header
      className="
        flex
        h-20
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/90
        px-8
        backdrop-blur-md
        dark:border-slate-800
        dark:bg-slate-900/90
      "
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {greeting},{" "}
          {firstName ?? "Founder"}.
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {formattedDate} • {formattedTime}
        </p>
      </div>

      <div className="flex items-center gap-3">

        <button
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            transition-all
            duration-200
            hover:bg-slate-100
            dark:border-slate-700
            dark:hover:bg-slate-800
          "
        >
          <Search size={18} />
        </button>

        <button
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            transition-all
            duration-200
            hover:bg-slate-100
            dark:border-slate-700
            dark:hover:bg-slate-800
          "
        >
          <Bell size={18} />
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
            },
          }}
        />

      </div>
    </header>
  );
}