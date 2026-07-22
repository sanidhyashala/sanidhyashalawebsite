import PageHeader from "./components/ui/PageHeader";
import DashboardLoading from "./components/DashboardLoading";

export default function Loading() {
  return (
    <div className="space-y-10">

      <PageHeader
        title="Dashboard"
        description="Loading dashboard..."
      />

      <DashboardLoading />

    </div>
  );
}