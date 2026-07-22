import type { ReactNode } from "react";

import PageHeader from "../ui/PageHeader";
import Section from "../ui/Section";

interface Props {
  title: string;

  description?: string;

  sectionTitle?: string;

  sectionDescription?: string;

  actions?: ReactNode;

  children: ReactNode;

  className?: string;
}

export default function AdminPage({
  title,
  description,
  sectionTitle,
  sectionDescription,
  actions,
  children,
  className = "",
}: Props) {
  return (
    <div className="space-y-10">

      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      <Section
        title={sectionTitle}
        description={sectionDescription}
      >
        <div className={className}>
          {children}
        </div>
      </Section>

    </div>
  );
}