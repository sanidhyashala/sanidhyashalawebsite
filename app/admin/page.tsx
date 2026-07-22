import { getDashboardData } from "@/app/lib/admin/dashboard.service";

import AdminPage from "./components/layout/AdminPage";

import WelcomeBanner from "./components/WelcomeBanner";
import DashboardStats from "./components/DashboardStats";
import RecentPendingReflections from "./components/RecentPendingReflections";

import QuickActions from "./components/QuickActions";

import RecentActivity from "./components/RecentActivity";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <AdminPage
      title="Dashboard"
      description="Everything inside SanidhyaShala begins here."
      sectionTitle="Overview"
    >
      <WelcomeBanner />

      <DashboardStats
        stats={dashboard.stats}
      />

      <RecentPendingReflections
        reflections={dashboard.recentPendingReflections}
      />
      <QuickActions />
      <RecentActivity />
    </AdminPage>
  );
}