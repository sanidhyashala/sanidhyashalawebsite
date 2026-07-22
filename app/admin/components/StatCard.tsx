import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import Card from "./ui/Card";

interface Props {
  title: string;
  value: number;
  description?: string;
  icon: LucideIcon;
  color?: string;
  href?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "bg-slate-900",
  href,
}: Props) {
  const content = (
    <Card
      className={
        href
          ? `
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            cursor-pointer
          `
          : ""
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">
            {value.toLocaleString()}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={`
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            text-white
            ${color}
          `}
        >
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}