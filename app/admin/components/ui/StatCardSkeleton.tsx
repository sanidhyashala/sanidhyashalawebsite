import Card from "./Card";
import LoadingSkeleton from "./LoadingSkeleton";

export default function StatCardSkeleton() {
  return (
    <Card hover={false}>
      <div className="flex items-start justify-between">

        <div className="space-y-4">

          <LoadingSkeleton className="h-4 w-28" />

          <LoadingSkeleton className="h-10 w-20" />

          <LoadingSkeleton className="h-4 w-36" />

        </div>

        <LoadingSkeleton className="h-12 w-12 rounded-2xl" />

      </div>
    </Card>
  );
}