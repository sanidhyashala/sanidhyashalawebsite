import Link from "next/link";

import AdminPage from "../../../../components/layout/AdminPage";

import {
  getAdminMcqSetById,
} from "@/app/lib/admin/mcq-bank/mcq-set.service";

import {
  getAdminMcqSetQuestions,
  getAdminAvailableMcqsForSet,
} from "@/app/lib/admin/mcq-bank/mcq-set-questions.service";

import {
  addMcqsToAdminMcqSet,
} from "@/app/lib/admin/mcq-bank/mcq-set-questions.actions";


type Props = {
  params: Promise<{
    id: string;
  }>;
};


export default async function AdminMcqSetQuestionsPage({
  params,
}: Props) {

  const { id } =
    await params;


  /*
   * -------------------------------------------------------
   * 1. Load MCQ Set
   * -------------------------------------------------------
   */

  const mcqSet =
    await getAdminMcqSetById(id);


  /*
   * -------------------------------------------------------
   * 2. Validate curriculum mapping
   * -------------------------------------------------------
   *
   * An MCQ Set must belong to a curriculum chapter
   * before chapter-wise questions can be selected.
   *
   */

  if (!mcqSet.curriculum_node_id) {

    return (
      <AdminPage
        title="Add MCQs"
        description={`Select MCQs for "${mcqSet.title}".`}
        actions={
          <Link
            href={`/admin/mcq-bank/sets/${mcqSet.id}`}
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            ← Back to Set
          </Link>
        }
      >

        <div
          className="
            rounded-2xl
            border
            border-yellow-200
            bg-yellow-50
            p-6
            dark:border-yellow-900/50
            dark:bg-yellow-950/20
          "
        >

          <p
            className="
              text-sm
              font-semibold
              text-yellow-800
              dark:text-yellow-300
            "
          >
            Curriculum mapping required
          </p>


          <p
            className="
              mt-2
              text-sm
              leading-6
              text-yellow-700
              dark:text-yellow-400
            "
          >
            This MCQ Set is not currently mapped to
            a curriculum chapter. Map the Set to a
            chapter before adding MCQs.
          </p>

        </div>

      </AdminPage>
    );
  }


  /*
   * -------------------------------------------------------
   * 3. Load questions already attached to this Set
   * -------------------------------------------------------
   */

  const attachedQuestions =
    await getAdminMcqSetQuestions(
      mcqSet.test_id
    );


  /*
   * -------------------------------------------------------
   * 4. Load chapter-wise available MCQs
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Only MCQs mapped to the same curriculum node
   * as this Set are loaded.
   *
   * Already attached questions are excluded by the
   * service itself.
   *
   */

  const availableMcqs =
    await getAdminAvailableMcqsForSet(
      mcqSet.test_id,
      mcqSet.curriculum_node_id
    );


  /*
   * -------------------------------------------------------
   * 5. Current Set statistics
   * -------------------------------------------------------
   */

  const currentQuestionCount =
    attachedQuestions.length;


  const recommendedQuestionCount =
    20;


  const isRecommendedSize =
    currentQuestionCount ===
    recommendedQuestionCount;


  const isExtendedSet =
    currentQuestionCount >
    recommendedQuestionCount;


  return (
    <AdminPage
      title="Add MCQs"
      description={`Select available MCQs to add to "${mcqSet.title}".`}
      actions={
        <Link
          href={`/admin/mcq-bank/sets/${mcqSet.id}`}
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          ← Back to Set
        </Link>
      }
    >

      <div className="space-y-6">


        {/* =================================================
         * Set Summary
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >

            <div className="min-w-0">

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    rounded-full
                    bg-blue-50
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-blue-700
                    dark:bg-blue-950
                    dark:text-blue-300
                  "
                >
                  MCQ SET
                </span>


                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-slate-700
                    dark:bg-slate-800
                    dark:text-slate-300
                  "
                >
                  Set {mcqSet.set_number}
                </span>


                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${
                      mcqSet.access_type ===
                      "PREMIUM"
                        ? `
                          bg-purple-100
                          text-purple-700
                          dark:bg-purple-500/10
                          dark:text-purple-400
                        `
                        : `
                          bg-green-100
                          text-green-700
                          dark:bg-green-500/10
                          dark:text-green-400
                        `
                    }
                  `}
                >
                  {mcqSet.access_type}
                </span>

              </div>


              <h2
                className="
                  mt-4
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {mcqSet.title}
              </h2>


              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                "
              >
                Select MCQs from the same curriculum
                chapter as this Set.
              </p>


              {/* Curriculum Identity */}

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-2
                "
              >

                {mcqSet.class_name && (
                  <span
                    className="
                      rounded-lg
                      bg-slate-100
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      text-slate-700
                      dark:bg-slate-800
                      dark:text-slate-300
                    "
                  >
                    Class: {mcqSet.class_name}
                  </span>
                )}


                {mcqSet.chapter_name && (
                  <span
                    className="
                      rounded-lg
                      bg-blue-50
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      text-blue-700
                      dark:bg-blue-950/40
                      dark:text-blue-300
                    "
                  >
                    Chapter: {mcqSet.chapter_name}
                  </span>
                )}

              </div>

            </div>


            {/* Question Count */}

            <div
              className="
                shrink-0
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-5
                py-4
                text-center
                dark:border-slate-700
                dark:bg-slate-950
              "
            >

              <p
                className="
                  text-2xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {currentQuestionCount}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Questions in Set
              </p>

            </div>

          </div>


          {/* Recommended Size */}

          <div
            className={`
              mt-5
              rounded-2xl
              border
              p-4
              ${
                isRecommendedSize
                  ? `
                    border-green-200
                    bg-green-50
                    dark:border-green-900/50
                    dark:bg-green-950/20
                  `
                  : isExtendedSet
                    ? `
                      border-blue-200
                      bg-blue-50
                      dark:border-blue-900/50
                      dark:bg-blue-950/20
                    `
                    : `
                      border-blue-100
                      bg-blue-50
                      dark:border-blue-900/50
                      dark:bg-blue-950/20
                    `
              }
            `}
          >

            <p
              className={`
                text-sm
                font-semibold
                ${
                  isRecommendedSize
                    ? `
                      text-green-800
                      dark:text-green-300
                    `
                    : `
                      text-blue-900
                      dark:text-blue-300
                    `
                }
              `}
            >
              {isRecommendedSize
                ? "Recommended Set Size Reached"
                : isExtendedSet
                  ? "Extended Set"
                  : `Recommended Set Size: ${recommendedQuestionCount} questions`}
            </p>


            <p
              className={`
                mt-1
                text-xs
                leading-5
                ${
                  isRecommendedSize
                    ? `
                      text-green-700
                      dark:text-green-400
                    `
                    : `
                      text-blue-800
                      dark:text-blue-400
                    `
                }
              `}
            >
              {isExtendedSet
                ? `This Set currently contains ${currentQuestionCount} questions. Larger Sets are supported when required.`
                : "20 questions is the recommended board-style format. There is no hard database limit, so larger Sets are supported."}
            </p>

          </div>

        </section>


        {/* =================================================
         * Available MCQs
         * ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div
            className="
              border-b
              border-slate-200
              px-6
              py-5
              dark:border-slate-800
            "
          >

            <div
              className="
                flex
                flex-col
                gap-2
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  MCQ Bank
                </p>


                <h3
                  className="
                    mt-2
                    text-lg
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Available MCQs
                </h3>


                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Only published MCQs mapped to{" "}
                  <span className="font-medium">
                    {mcqSet.class_name ?? "this class"}
                  </span>{" "}
                  /{" "}
                  <span className="font-medium">
                    {mcqSet.chapter_name ?? "this chapter"}
                  </span>{" "}
                  are available.
                </p>

              </div>


              <p
                className="
                  text-sm
                  text-slate-500
                "
              >
                {availableMcqs.length} available
              </p>

            </div>

          </div>


          {availableMcqs.length === 0 ? (

            /* =================================================
             * Empty State
             * ================================================= */

            <div
              className="
                px-6
                py-16
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <span
                  className="
                    text-xl
                    font-bold
                  "
                >
                  ✓
                </span>
              </div>


              <h4
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                No MCQs available
              </h4>


              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-400
                "
              >
                There are currently no published MCQs
                mapped to this exact curriculum chapter,
                or all eligible MCQs are already attached
                to this Set.
              </p>


              <div className="mt-6">

                <Link
                  href="/admin/mcq-bank"
                  className="
                    inline-flex
                    items-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-300
                    dark:hover:bg-slate-800
                  "
                >
                  Open MCQ Bank
                </Link>

              </div>

            </div>

          ) : (

            /* =================================================
             * Selection Form
             * ================================================= */

            <form
              action={
                addMcqsToAdminMcqSet
              }
            >

              {/* Hidden Test ID */}

              <input
                type="hidden"
                name="test_id"
                value={mcqSet.test_id}
              />


              {/* =================================================
               * MCQ Table
               * ================================================= */}

              <div className="overflow-x-auto">

                <table
                  className="
                    w-full
                    min-w-[1180px]
                    text-left
                  "
                >

                  <thead
                    className="
                      border-b
                      border-slate-200
                      bg-slate-50
                      dark:border-slate-800
                      dark:bg-slate-950
                    "
                  >

                    <tr>

                      <th
                        className="
                          w-16
                          px-5
                          py-4
                        "
                      >
                        <span className="sr-only">
                          Select
                        </span>
                      </th>


                      <th
                        className="
                          px-5
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        MCQ
                      </th>


                      <th
                        className="
                          px-5
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Difficulty
                      </th>


                      <th
                        className="
                          px-5
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Marks
                      </th>


                      <th
                        className="
                          px-5
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Source
                      </th>


                      <th
                        className="
                          px-5
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody
                    className="
                      divide-y
                      divide-slate-200
                      dark:divide-slate-800
                    "
                  >

                    {availableMcqs.map(
                      (mcq) => (

                        <tr
                          key={mcq.id}
                          className="
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-slate-950/50
                          "
                        >

                          {/* Select */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >

                            <input
                              type="checkbox"
                              name="question_ids"
                              value={mcq.id}
                              aria-label={`Select ${mcq.question_text}`}
                              className="
                                mt-1
                                h-4
                                w-4
                                cursor-pointer
                                rounded
                                border-slate-300
                                text-blue-700
                                focus:ring-blue-500
                              "
                            />

                          </td>


                          {/* MCQ */}

                          <td
                            className="
                              px-5
                              py-5
                            "
                          >

                            <div
                              className="
                                max-w-2xl
                              "
                            >

                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  leading-6
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {mcq.question_text}
                              </p>


                              <p
                                className="
                                  mt-1
                                  font-mono
                                  text-xs
                                  text-slate-500
                                "
                              >
                                {mcq.id}
                              </p>

                            </div>

                          </td>


                          {/* Difficulty */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >

                            <span
                              className="
                                text-sm
                                text-slate-700
                                dark:text-slate-300
                              "
                            >
                              {mcq.difficulty ??
                                "—"}
                            </span>

                          </td>


                          {/* Marks */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >

                            <span
                              className="
                                text-sm
                                text-slate-700
                                dark:text-slate-300
                              "
                            >
                              {mcq.marks ??
                                "—"}
                            </span>

                          </td>


                          {/* Source */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >

                            <div>

                              <p
                                className="
                                  text-sm
                                  font-medium
                                  text-slate-800
                                  dark:text-slate-200
                                "
                              >
                                {mcq.source_type}
                              </p>


                              {mcq.source_reference && (
                                <p
                                  className="
                                    mt-1
                                    text-xs
                                    text-slate-500
                                  "
                                >
                                  {
                                    mcq.source_reference
                                  }
                                </p>
                              )}

                            </div>

                          </td>


                          {/* Status */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >

                            <span
                              className="
                                inline-flex
                                rounded-full
                                bg-green-100
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                text-green-700
                                dark:bg-green-500/10
                                dark:text-green-400
                              "
                            >
                              {mcq.status}
                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* =================================================
               * Form Footer
               * ================================================= */}

              <div
                className="
                  flex
                  flex-col
                  gap-4
                  border-t
                  border-slate-200
                  bg-slate-50
                  px-6
                  py-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  dark:border-slate-800
                  dark:bg-slate-950
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-800
                      dark:text-slate-200
                    "
                  >
                    Select the MCQs you want
                    to add to this Set.
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Only MCQs from the same curriculum
                    chapter are shown here.
                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Selected questions will be assigned
                    the next available question order
                    automatically.
                  </p>

                </div>


                <button
                  type="submit"
                  className="
                    shrink-0
                    rounded-xl
                    bg-blue-700
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-800
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                    dark:focus:ring-offset-slate-950
                  "
                >
                  Add Selected MCQs
                </button>

              </div>

            </form>

          )}

        </section>


        {/* =================================================
         * Workflow Notice
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-blue-100
            bg-blue-50
            p-5
            dark:border-blue-900/50
            dark:bg-blue-950/20
          "
        >

          <p
            className="
              text-sm
              font-semibold
              text-blue-900
              dark:text-blue-300
            "
          >
            MCQ Set Workflow
          </p>


          <p
            className="
              mt-2
              text-sm
              leading-6
              text-blue-800
              dark:text-blue-400
            "
          >
            An MCQ must belong to the same curriculum
            chapter as the Set before it can appear in
            the selection list. Only Published MCQs are
            currently eligible for selection. The Set
            remains the publishing boundary for
            student-facing access.
          </p>

        </section>


      </div>

    </AdminPage>
  );
}