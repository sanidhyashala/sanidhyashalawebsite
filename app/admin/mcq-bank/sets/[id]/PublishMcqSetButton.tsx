"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  publishAdminMcqSet,
} from "@/app/lib/admin/mcq-bank/mcq-set.actions";


type Props = {
  resourceId: string;
};


export default function PublishMcqSetButton({
  resourceId,
}: Props) {

  const router =
    useRouter();


  const [publishing, setPublishing] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);


  async function handlePublish() {

    if (publishing) {
      return;
    }


    setError(null);

    setPublishing(true);


    try {

      const result =
        await publishAdminMcqSet(
          resourceId
        );


      if (!result.success) {

        setError(
          result.message
        );

        return;
      }


      /*
       * Refresh the Server Component so that:
       *
       * resource_status
       * test_status
       *
       * and the rest of the Set data
       * are loaded again from Supabase.
       */

      router.refresh();

    } catch (publishError) {

      console.error(
        "MCQ Set publishing failed:",
        publishError
      );


      setError(
        publishError instanceof Error
          ? publishError.message
          : "Failed to publish MCQ Set."
      );

    } finally {

      setPublishing(false);

    }
  }


  return (
    <div className="flex flex-col items-end gap-2">

      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-green-700
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          shadow-sm
          transition
          hover:bg-green-800
          focus:outline-none
          focus:ring-2
          focus:ring-green-500
          focus:ring-offset-2
          disabled:cursor-not-allowed
          disabled:opacity-60
          dark:focus:ring-offset-slate-900
        "
      >

        {publishing ? (
          <>
            <span
              className="
                h-4
                w-4
                animate-spin
                rounded-full
                border-2
                border-white
                border-t-transparent
              "
            />

            Publishing...
          </>
        ) : (
          <>
            Publish Set
          </>
        )}

      </button>


      {error && (
        <p
          className="
            max-w-xs
            text-right
            text-xs
            font-medium
            text-red-600
            dark:text-red-400
          "
        >
          {error}
        </p>
      )}

    </div>
  );
}