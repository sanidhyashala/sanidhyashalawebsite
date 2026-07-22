import Badge from "../../Badge";

import type { ReflectionStatus } from "@/app/lib/reflection/reflection-types";

interface Props {
  status: ReflectionStatus;
}

const config = {
  draft: {
    label: "Draft",
    variant: "default" as const,
  },

  pending: {
    label: "Pending",
    variant: "warning" as const,
  },

  published: {
    label: "Published",
    variant: "success" as const,
  },

  rejected: {
    label: "Rejected",
    variant: "danger" as const,
  },

  archived: {
    label: "Archived",
    variant: "default" as const,
  },
};

export default function StatusCell({
  status,
}: Props) {
  return (
    <Badge variant={config[status].variant}>
      {config[status].label}
    </Badge>
  );
}