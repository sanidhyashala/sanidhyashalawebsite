import {
  Archive,
  BookOpen,
  GraduationCap,
  Mail,
  PenSquare,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import StatCard from "./StatCard";

interface Props {
  stats: {
    reflections: {
      pending: number;
      published: number;
      rejected: number;
      archived: number;
      total: number;
    };

    journal: {
      generated: number;
      published: number;
      archived: number;
      legacy: number;
      total: number;
    };

    learning: {
      resources: number;
    };

    students: {
      total: number;
    };

    newsletter: {
      subscribers: number;
    };
  };
}

export default function DashboardStats({
  stats,
}: Props) {
  return (
    <div
      className="
        mt-12
        grid
        gap-6

        sm:grid-cols-2

        xl:grid-cols-3
      "
    >
      <StatCard
        title="Pending Reflections"
        value={stats.reflections.pending}
        description="Awaiting moderation"
        icon={PenSquare}
        color="bg-amber-500"
        href="/admin/reflections?status=pending"
      />

      <StatCard
        title="Published Reflections"
        value={stats.reflections.published}
        description="Visible to readers"
        icon={CheckCircle2}
        color="bg-emerald-600"
        href="/admin/reflections?status=published"
      />

      <StatCard
        title="Rejected Reflections"
        value={stats.reflections.rejected}
        description="Rejected submissions"
        icon={XCircle}
        color="bg-red-600"
        href="/admin/reflections?status=rejected"
      />

      <StatCard
        title="Archived Reflections"
        value={stats.reflections.archived}
        description="Stored for record"
        icon={Archive}
        color="bg-slate-600"
        href="/admin/reflections?status=archived"
      />

      <StatCard
        title="Total Reflections"
        value={stats.reflections.total}
        description="All reflections"
        icon={BookOpen}
        color="bg-indigo-600"
        href="/admin/reflections"
      />

      {/* Journal Cards Sequence */}
      <StatCard
        title="Generated Articles"
        value={stats.journal.generated}
        description="Ready for publishing"
        icon={PenSquare}
        color="bg-amber-600"
        href="/admin/journal"
      />

      <StatCard
        title="Published Articles"
        value={stats.journal.published}
        description="Published CMS articles"
        icon={CheckCircle2}
        color="bg-emerald-600"
        href="/admin/journal"
      />

      <StatCard
        title="Archived Articles"
        value={stats.journal.archived}
        description="Archived CMS articles"
        icon={Archive}
        color="bg-slate-500"
        href="/admin/journal"
      />

      <StatCard
        title="Legacy Articles"
        value={stats.journal.legacy}
        description="Preserved journal library"
        icon={BookOpen}
        color="bg-indigo-600"
        href="/admin/journal"
      />

      <StatCard
        title="Total Journal Articles"
        value={stats.journal.total}
        description="CMS and legacy articles"
        icon={BookOpen}
        color="bg-blue-600"
        href="/admin/journal"
      />

      <StatCard
        title="Learning Resources"
        value={stats.learning.resources}
        description="Notes, MCQs & PDFs"
        icon={GraduationCap}
        color="bg-violet-600"
        href="/learning"
      />

      <StatCard
        title="Students"
        value={stats.students.total}
        description="Registered learners"
        icon={Users}
        color="bg-cyan-600"
      />

      <StatCard
        title="Newsletter"
        value={stats.newsletter.subscribers}
        description="Subscribers"
        icon={Mail}
        color="bg-rose-600"
      />
    </div>
  );
}