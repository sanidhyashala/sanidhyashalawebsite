import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import {
  getReflection,
} from "@/app/lib/reflection/reflection-service";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReflectionPage({
  params,
}: Props) {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const { id } = await params;

  const reflection =
    await getReflection(id);

  if (!reflection) {
    notFound();
  }

  if (reflection.authorId !== userId) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">

      <span
        className="
          inline-flex
          rounded-full
          bg-slate-100
          px-4
          py-1
          text-sm
          capitalize
          text-slate-700
        "
      >
        {reflection.status}
      </span>

      <h1 className="mt-6 text-4xl font-bold">
        {reflection.question}
      </h1>

      <p className="mt-4 text-sm text-slate-500">
        Created on{" "}
        {new Date(
          reflection.createdAt
        ).toLocaleDateString("en-IN")}
      </p>

      <article
        className="
          mt-10
          whitespace-pre-wrap
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-8
          leading-8
          text-slate-700
          shadow-sm
        "
      >
        {reflection.content}
      </article>

      {reflection.rejectionReason && (
        <section
          className="
            mt-10
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
          "
        >
          <h2 className="font-semibold text-red-700">
            Rejection Reason
          </h2>

          <p className="mt-3 text-red-600">
            {reflection.rejectionReason}
          </p>
        </section>
      )}

      {reflection.adminNote && (
        <section
          className="
            mt-6
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-6
          "
        >
          <h2 className="font-semibold">
            Admin Note
          </h2>

          <p className="mt-3">
            {reflection.adminNote}
          </p>
        </section>
      )}

      {reflection.status === "rejected" && (
        <div className="mt-10 flex justify-end">
          <Link
            href={`/reflection/edit/${reflection.id}`}
            className="
              rounded-2xl
              bg-red-600
              px-6
              py-3
              font-medium
              text-white
              transition
              hover:bg-red-700
            "
          >
            Edit & Resubmit
          </Link>
        </div>
      )}

    </main>
  );
}