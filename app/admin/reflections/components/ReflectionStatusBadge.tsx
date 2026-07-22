import type {
  ReflectionStatus,
} from "@/app/lib/reflection/reflection-types";

interface Props {
  status: ReflectionStatus;
}

export default function ReflectionStatusBadge({
  status,
}: Props) {
  return (
    <span
      className="
        rounded-full
        bg-amber-100
        px-4
        py-1.5
        text-xs
        font-semibold
        uppercase
        tracking-wider
        text-amber-700

        dark:bg-amber-900/40
        dark:text-amber-300
      "
    >
      {status}
    </span>
  );
}