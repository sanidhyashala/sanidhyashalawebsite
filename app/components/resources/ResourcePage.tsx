import ResourceCard from "./ResourceCard";
import { ResourcePageProps } from "./resourceTypes";

export default function ResourcePage({
  title,
  description,
  category,
  className,
  resources,
}: ResourcePageProps) {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-5xl font-bold text-blue-900">
          {title}
        </h1>

        <p className="mb-12 text-lg text-slate-600">
          {description}
        </p>

        <div className="grid gap-4">
          {resources.map((resource, index) => (
            <ResourceCard
              key={resource.slug}
              resource={resource}
              index={index}
              category={category}
              className={className}
            />
          ))}
        </div>
      </div>
    </main>
  );
}