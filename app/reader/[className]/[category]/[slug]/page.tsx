import { notFound } from "next/navigation";

import PDFViewerClient from "@/app/components/pdf/PDFViewerClient";
import ContinueLearning from "@/app/components/resources/ContinueLearning";

import {
  getClassResources,
  getRelatedResources,
} from "@/lib/resources";

interface ReaderPageProps {
  params: Promise<{
    className: string;
    category: string;
    slug: string;
  }>;
}

export default async function ReaderPage({
  params,
}: ReaderPageProps) {
  const { className, category, slug } = await params;

  const resources = getClassResources(className);

  if (!resources) {
    notFound();
  }

  const categoryKey =
    category === "case-based"
      ? "caseBased"
      : (category as keyof typeof resources);

  const list = resources[categoryKey];

  if (!Array.isArray(list)) {
    notFound();
  }

  const resource = list.find(
    (item) => item.slug === slug
  );

  if (!resource) {
    notFound();
  }

  const pdfUrl = `/api/files/${category}/${className}/${resource.pdf}`;

  const relatedResources = getRelatedResources(
    className,
    category,
    slug
  );

  return (
    <div className="mx-auto max-w-6xl">

      <PDFViewerClient
        title={resource.title}
        pdfUrl={pdfUrl}
      />

      <ContinueLearning
        className={className}
        category={category}
        resources={relatedResources}
      />

    </div>
  );
}