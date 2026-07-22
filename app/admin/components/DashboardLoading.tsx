import StatCardSkeleton from "./ui/StatCardSkeleton";

export default function DashboardLoading() {
  return (
    <div
      className="
        grid
        gap-6

        sm:grid-cols-2

        xl:grid-cols-3
      "
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <StatCardSkeleton
          key={index}
        />
      ))}
    </div>
  );
}