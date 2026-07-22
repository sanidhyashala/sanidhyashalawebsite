import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getPromptById,
  getPreviousPrompt,
  getNextPrompt,
  getPromptPosition,
} from "@/app/lib/prompt/prompt-service";

import {
  getPublishedReflectionsByPrompt,
  getPublishedReflectionCountByPrompt,
} from "@/app/lib/reflection/reflection-service";

import ReflectionItem from "@/app/components/reflection/feed/ReflectionItem";

import PromptNavigation from "@/app/components/reflection/archive/PromptNavigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PromptArchivePage({
  params,
}: Props) {
  const { id } = await params;

  const prompt =
    await getPromptById(id);

  if (!prompt) {
    notFound();
  }

  const reflections =
    await getPublishedReflectionsByPrompt(
      prompt.id
    );

    const previousPrompt =
  await getPreviousPrompt(
    prompt.id
  );

const nextPrompt =
  await getNextPrompt(
    prompt.id
  );

  const position =
  await getPromptPosition(
    prompt.id
  );

    const reflectionCount =
  await getPublishedReflectionCountByPrompt(
    prompt.id
  );

  return (
    <main className="px-6 py-24">

      <div className="mx-auto max-w-5xl">

        <Link
          href="/reflection/archive"
          className="
            inline-flex
            text-sm
            font-medium
            text-slate-500
            transition-colors

            hover:text-slate-900

            dark:text-slate-400
            dark:hover:text-white
          "
        >
          ← Back to Archive
        </Link>

        <p
          className="
            mt-10
            text-sm
            font-semibold
            uppercase
            tracking-[0.25em]
            text-slate-500
          "
        >
          Reflection Archive
        </p>

        <h1
          className="
            mt-6
            text-5xl
            font-bold
            tracking-tight

            text-slate-900
            dark:text-white
          "
        >
          {prompt.title}
        </h1>

        <p
          className="
            mt-8
            max-w-3xl
            text-lg
            leading-9

            text-slate-600
            dark:text-slate-300
          "
        >
          {prompt.description}
        </p>

        <div
  className="
    mt-12
    flex
    flex-wrap
    gap-8
  "
>

  <div>
    <p
      className="
        text-xs
        font-semibold
        uppercase
        tracking-[0.2em]
        text-slate-500
      "
    >
      Published Reflections
    </p>

    <p
      className="
        mt-2
        text-3xl
        font-bold
        text-slate-900

        dark:text-white
      "
    >
      {reflectionCount}
    </p>
  </div>

  <div>
    <p
      className="
        text-xs
        font-semibold
        uppercase
        tracking-[0.2em]
        text-slate-500
      "
    >
      Started
    </p>

    <p
      className="
        mt-2
        text-lg
        font-medium
        text-slate-700

        dark:text-slate-300
      "
    >
      {new Date(
        prompt.createdAt
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </p>
  </div>

</div>

        <div className="mt-20">

            <PromptNavigation
  previousPrompt={previousPrompt}
  nextPrompt={nextPrompt}
  current={position.current}
  total={position.total}
/>

          {reflections.length === 0 ? (

            <div
              className="
                rounded-3xl
                border
                border-dashed
                border-slate-300
                p-12
                text-center

                dark:border-slate-700
              "
            >
              <h2
                className="
                  text-2xl
                  font-semibold

                  text-slate-900
                  dark:text-white
                "
              >
                No reflections yet
              </h2>

              <p
                className="
                  mt-4
                  text-slate-600
                  dark:text-slate-400
                "
              >
                No published reflections are
                available for this prompt.
              </p>

            </div>

          ) : (

            <div className="space-y-8">

              {reflections.map(
                (reflection) => (
                  <ReflectionItem
                    key={reflection.id}
                    reflection={reflection}
                  />
                )
              )}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}