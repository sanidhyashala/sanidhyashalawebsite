import DashboardCard from "./DashboardCard";

export default function DashboardGrid() {
  return (
    <section className="mt-12">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        <DashboardCard
          title="Reflections"
          description="Review, publish and moderate community reflections."
          href="/admin/reflections"
          icon="🌿"
        />

        <DashboardCard
          title="Journal"
          description="Create and manage journal articles."
          href="/admin/journal"
          icon="📖"
        />

        <DashboardCard
          title="Learning"
          description="Upload notes, PDFs and learning resources."
          href="/admin/learning"
          icon="📚"
        />

        <DashboardCard
          title="Question Bank"
          description="Manage MCQs, PYQs and practice papers."
          href="/admin/question-bank"
          icon="📝"
        />

        <DashboardCard
          title="Students"
          description="View students and their activity."
          href="/admin/students"
          icon="👥"
        />

        <DashboardCard
          title="Analytics"
          description="Track platform growth and engagement."
          href="/admin/analytics"
          icon="📊"
        />

      </div>
    </section>
  );
}