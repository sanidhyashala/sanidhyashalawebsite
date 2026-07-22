import type { Metadata } from "next";
import type { ReactNode } from "react";

import { currentUser } from "@clerk/nextjs/server";

import { requireAdmin } from "@/app/lib/auth/admin";

import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: Props) {
  await requireAdmin();

  const user = await currentUser();

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">

      <div className="flex h-full">

        {/* Sidebar */}

        <aside className="sticky top-0 h-screen shrink-0">
          <AdminSidebar />
        </aside>

        {/* Right Section */}

        <div className="flex flex-1 flex-col overflow-hidden">

          <header className="sticky top-0 z-40">
            <AdminHeader
              firstName={user?.firstName}
            />
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>

        </div>

      </div>

    </div>
  );
}