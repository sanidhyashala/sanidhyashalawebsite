
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getStudentMcqSets,
} from "@/app/lib/learning/mcq.service";

import {
  requireLearningAuth,
} from "@/lib/learning/learning-auth";

import {
  createLearningSupabaseClient,
} from "@/lib/learning/supabase-learning";

import {
  getLearningAccessProducts,
} from "@/lib/learning/access-products";

import ChapterAccessCard from "@/components/learning/ChapterAccessCard";

type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export default async function Class11McqChapterPage({
  params,
}: PageProps) {
  const { chapterId } = await params;

  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const sets = await getStudentMcqSets("class-11");

  const chapterSets = sets.filter(
    (set) => set.chapterId === chapterId
  );

  if (chapterSets.length === 0) {
    notFound();
  }

  const chapter = chapterSets[0];

  const subjectName = chapter.subjectName;
  const branchName = chapter.branchName;

  /*
   * Check access separately for every published set.
   * FREE sets remain available without a purchase.
   * PREMIUM access is decided by the database RPC.
   */
  const setsWithAccess = await Promise.all(
    chapterSets.map(async (set) => {
      if (set.accessType !== "PREMIUM") {
        return {
          ...set,
          hasAccess: true,
        };
      }

      const { data, error } = await supabase.rpc(
        "user_has_learning_product_access",
        {
          p_resource_id: set.resourceId,
        }
      );

      if (error) {
        throw new Error(
          `Could not verify MCQ access for resource ${set.resourceId}: ${error.message}`
        );
      }

      return {
        ...set,
        hasAccess: data === true,
      };
    })
  );

  const hasLockedPremiumSets = setsWithAccess.some(
    (set) =>
      set.accessType === "PREMIUM" &&
      !set.hasAccess
  );

  /*
   * Resolve the chapter product and its current database price.
   * Show the purchase card only when a Premium set is locked.
   */
  const accessProducts = hasLockedPremiumSets
    ? await getLearningAccessProducts({
        curriculumNodeIds: [chapterId],
        productType: "CHAPTER",
      })
    : new Map();

  const chapterProduct = accessProducts.get(chapterId);

  const returnTo = `/learning/class-11/mcq/${chapterId}`;

  return (
    <main className="px-6 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/learning/class-11"
            className="transition hover:text-blue-700 dark:hover:text-blue-400"
          >
            Class XI
          </Link>

          <span>/</span>

          <Link
            href="/learning/class-11/mcq"
            className="transition hover:text-blue-700 dark:hover:text-blue-400"
          >
            MCQ Practice
          </Link>

          <span>/</span>
          <span>{subjectName}</span>

          {branchName && (
            <>
              <span>/</span>
              <span>{branchName}</span>
            </>
          )}

          <span>/</span>
          <span>{chapter.chapterName}</span>
        </div>

        {/* Header */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
            {subjectName}
            {branchName ? ` · ${branchName}` : ""}
            {" · Chapter "}
            {chapter.chapterSequence ?? ""}
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 sm:text-5xl">
            {chapter.chapterName}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
            Choose an MCQ practice set to begin practicing
            this chapter.
          </p>
        </header>

        {/* Chapter Overview */}
        <section className="mb-10 rounded-3xl border border-blue-100 bg-blue-50/70 p-6 dark:border-blue-900 dark:bg-blue-950/30 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Practice sets
          </p>

          <h2 className="mt-2 text-xl font-bold text-blue-950 dark:text-blue-200">
            Choose a set and begin
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-800 dark:text-blue-200">
            Each published set contains carefully selected
            multiple-choice questions for this chapter.
            Premium sets require chapter access.
          </p>
        </section>

        {/* MCQ Sets */}
        <section>
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
              Available sets
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              MCQ Practice Sets
            </h2>
          </div>

          <div className="grid gap-4">
            {setsWithAccess.map((set) => {
              const isPremium = set.accessType === "PREMIUM";
              const canPractice = set.hasAccess;

              return (
                <article
                  key={set.resourceId}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                          {set.setNumber !== null
                            ? `Set ${set.setNumber}`
                            : "Practice Set"}
                        </p>

                        {isPremium && (
                          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                            Premium
                          </span>
                        )}

                        {isPremium && canPractice && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            Access available
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                        {set.title}
                      </h3>

                      {set.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {set.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          {set.questionCount}{" "}
                          {set.questionCount === 1
                            ? "question"
                            : "questions"}
                        </span>

                        <span>
                          {!isPremium
                            ? "Free access"
                            : canPractice
                              ? "Included in your access"
                              : "Chapter access required"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canPractice ? (
                        <Link
                          href={`/learning/resources/${set.resourceId}`}
                          className="inline-flex font-semibold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Start Practice →
                        </Link>
                      ) : (
                        <span className="inline-flex cursor-not-allowed font-semibold text-slate-400 dark:text-slate-500">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Chapter Purchase */}
        {hasLockedPremiumSets && (
          <section className="mt-10">
            <ChapterAccessCard
              product={chapterProduct}
              returnTo={returnTo}
            />
          </section>
        )}

        {/* Bottom Navigation */}
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <Link
            href="/learning/class-11/mcq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← Back to MCQ Practice
          </Link>
        </div>
      </div>
    </main>
  );
}
