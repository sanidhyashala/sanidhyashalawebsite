import Link from "next/link";

import AdminPage from "../../../components/layout/AdminPage";

import {
  getAdminMcqSetById,
} from "@/app/lib/admin/mcq-bank/mcq-set.service";

import {
  getAdminMcqSetQuestions,
} from "@/app/lib/admin/mcq-bank/mcq-set-questions.service";

import MathTextPreview from "../../components/MathTextPreview";

import PublishMcqSetButton from "./PublishMcqSetButton";


type Props = {
  params: Promise<{
    id: string;
  }>;
};


export default async function AdminMcqSetDetailPage({
  params,
}: Props) {

  const { id } =
    await params;


  /*
   * -------------------------------------------------------
   * Load Set
   * -------------------------------------------------------
   */

  const mcqSet =
    await getAdminMcqSetById(id);


  /*
   * -------------------------------------------------------
   * Load questions already attached to Set
   * -------------------------------------------------------
   */

  const questions =
    await getAdminMcqSetQuestions(
      mcqSet.test_id
    );


  /*
   * -------------------------------------------------------
   * Set statistics
   * -------------------------------------------------------
   *
   * 20 questions is the recommended board-style
   * set size, NOT a hard system limit.
   *
   * Admin may create larger sets when required.
   * -------------------------------------------------------
   */

  const questionCount =
    questions.length;


  const recommendedSetSize =
    20;


  const isRecommendedSize =
    questionCount ===
    recommendedSetSize;


  const isEmpty =
    questionCount === 0;


  const isExtendedSet =
    questionCount >
    recommendedSetSize;


  const isPublished =
    mcqSet.resource_status ===
    "PUBLISHED";


  return (
    <AdminPage
      title="MCQ Set"
      description="Manage the test configuration and questions belonging to this MCQ practice set."
      actions={
        <Link
          href="/admin/mcq-bank"
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
          ← Back to MCQ Bank
        </Link>
      }
    >

      <div className="space-y-6">

        {/* =================================================
         * Set Header
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
              gap-6
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >

            <div className="min-w-0">

              {/* =================================================
               * Badges
               * ================================================= */}

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >

                {/* MCQ SET */}

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


                {/* Set Number */}

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


                {/* Access */}

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


                {/* Resource Status */}

                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${
                      mcqSet.resource_status ===
                      "PUBLISHED"
                        ? `
                          bg-green-100
                          text-green-700
                          dark:bg-green-500/10
                          dark:text-green-400
                        `
                        : mcqSet.resource_status ===
                          "DRAFT"
                          ? `
                            bg-yellow-100
                            text-yellow-700
                            dark:bg-yellow-500/10
                            dark:text-yellow-400
                          `
                          : `
                            bg-slate-100
                            text-slate-600
                            dark:bg-slate-800
                            dark:text-slate-300
                          `
                    }
                  `}
                >
                  {mcqSet.resource_status}
                </span>

              </div>


              {/* =================================================
               * Curriculum Identity
               * ================================================= */}

              {(mcqSet.class_name ||
                mcqSet.chapter_name) && (

                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >

                  {/* Class */}

                  {mcqSet.class_name && (
                    <span
                      className="
                        inline-flex
                        items-center
                        rounded-lg
                        border
                        border-blue-200
                        bg-blue-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-blue-800
                        dark:border-blue-900/60
                        dark:bg-blue-950/30
                        dark:text-blue-300
                      "
                    >
                      Class: {mcqSet.class_name}
                    </span>
                  )}


                  {/* Separator */}

                  {mcqSet.class_name &&
                    mcqSet.chapter_name && (
                      <span
                        className="
                          text-slate-400
                          dark:text-slate-600
                        "
                      >
                        →
                      </span>
                    )}


                  {/* Chapter */}

                  {mcqSet.chapter_name && (
                    <span
                      className="
                        inline-flex
                        items-center
                        rounded-lg
                        border
                        border-slate-200
                        bg-slate-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-slate-700
                        dark:border-slate-700
                        dark:bg-slate-800
                        dark:text-slate-300
                      "
                    >
                      Chapter: {mcqSet.chapter_name}
                    </span>
                  )}

                </div>

              )}


              {/* =================================================
               * Title
               * ================================================= */}

              <h2
                className="
                  mt-4
                  text-2xl
                  font-bold
                  leading-9
                  text-slate-900
                  dark:text-white
                "
              >
                {mcqSet.title}
              </h2>


              {/* Description */}

              {mcqSet.description && (
                <p
                  className="
                    mt-3
                    max-w-3xl
                    text-sm
                    leading-6
                    text-slate-600
                    dark:text-slate-400
                  "
                >
                  {mcqSet.description}
                </p>
              )}


              {/* =================================================
               * IDs
               * ================================================= */}

              <div
                className="
                  mt-4
                  space-y-1
                  text-xs
                  text-slate-500
                "
              >

                <p>
                  Resource ID:{" "}
                  <span className="font-mono">
                    {mcqSet.resource_id}
                  </span>
                </p>

                <p>
                  Test ID:{" "}
                  <span className="font-mono">
                    {mcqSet.test_id}
                  </span>
                </p>

                {mcqSet.curriculum_node_id && (
                  <p>
                    Curriculum Node ID:{" "}
                    <span className="font-mono">
                      {mcqSet.curriculum_node_id}
                    </span>
                  </p>
                )}

                {mcqSet.curriculum_version_id && (
                  <p>
                    Curriculum Version ID:{" "}
                    <span className="font-mono">
                      {mcqSet.curriculum_version_id}
                    </span>
                  </p>
                )}

              </div>

            </div>


            {/* =================================================
             * Set Actions
             * ================================================= */}

            <div
              className="
                flex
                shrink-0
                flex-col
                items-stretch
                gap-3
                sm:flex-row
                lg:flex-col
              "
            >

              {/* Add MCQs */}

              <Link
                href={`/admin/mcq-bank/sets/${mcqSet.id}/questions`}
                className="
                  inline-flex
                  items-center
                  justify-center
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
                "
              >
                + Add MCQs
              </Link>


              {/* =================================================
               * Publish Set
               * =================================================
               *
               * Publishing belongs to Content Creation.
               *
               * A Set can only be published when:
               *
               *   - It is not already published
               *   - At least one MCQ is attached
               *
               * Access & Pricing is intentionally NOT involved.
               * ================================================= */}

              {!isPublished &&
                !isEmpty && (
                  <PublishMcqSetButton
                    resourceId={
                      mcqSet.resource_id
                    }
                  />
                )}

            </div>

          </div>


          {/* =================================================
           * Draft Publishing Notice — Empty
           * ================================================= */}

          {!isPublished &&
            isEmpty && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-yellow-200
                  bg-yellow-50
                  p-4
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
                  Set is not ready to publish
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-yellow-700
                    dark:text-yellow-400
                  "
                >
                  Add at least one MCQ to this Set
                  before publishing it for students.
                </p>

              </div>
            )}


          {/* =================================================
           * Ready to Publish Notice
           * ================================================= */}

          {!isPublished &&
            !isEmpty && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50
                  p-4
                  dark:border-blue-900/50
                  dark:bg-blue-950/20
                "
              >

                <p
                  className="
                    text-sm
                    font-semibold
                    text-blue-800
                    dark:text-blue-300
                  "
                >
                  Set is ready for publication
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-blue-700
                    dark:text-blue-400
                  "
                >
                  Review the attached MCQs and publish
                  this Set when the content is ready for
                  students.
                </p>

              </div>
            )}


          {/* =================================================
           * Published Notice
           * ================================================= */}

          {isPublished && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-green-200
                bg-green-50
                p-4
                dark:border-green-900/50
                dark:bg-green-950/20
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  text-green-800
                  dark:text-green-300
                "
              >
                Set Published
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-green-700
                  dark:text-green-400
                "
              >
                This MCQ Set is published. Its
                associated MCQ test is also marked
                as published.
              </p>

            </div>
          )}

        </section>


        {/* =================================================
         * Question Summary
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
                Question Set
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
                {questionCount} Questions
              </h3>


              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                Recommended board-style set size:
                {" "}
                {recommendedSetSize} questions.
                {" "}
                Larger sets are also supported.
              </p>

            </div>


            {/* Count */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-6
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
                {questionCount}
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


          {/* Recommended size */}

          {isRecommendedSize && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-green-200
                bg-green-50
                p-4
                dark:border-green-900/50
                dark:bg-green-950/20
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  text-green-800
                  dark:text-green-300
                "
              >
                Recommended Set Size Reached
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-green-700
                  dark:text-green-400
                "
              >
                This set currently contains the
                recommended 20 questions. You may
                still add more questions if required.
              </p>

            </div>
          )}


          {/* Extended Set */}

          {isExtendedSet && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-blue-200
                bg-blue-50
                p-4
                dark:border-blue-900/50
                dark:bg-blue-950/20
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  text-blue-800
                  dark:text-blue-300
                "
              >
                Extended Set
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-blue-700
                  dark:text-blue-400
                "
              >
                This set contains {questionCount} questions.
                The recommended board-style size is 20,
                but there is no hard question limit.
              </p>

            </div>
          )}


          {/* Empty */}

          {isEmpty && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-950
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                No questions attached
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Add MCQs to start building this
                practice Set. MCQs may be in DRAFT
                status while the Set is being prepared.
              </p>

            </div>
          )}

        </section>


        {/* =================================================
         * Test Configuration
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

          <div className="mb-5">

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Test Configuration
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
              Assessment Settings
            </h3>

          </div>


          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            {/* Duration */}

            <div>

              <p className="text-xs text-slate-500">
                Duration
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcqSet.duration_minutes ??
                  "—"}

                {mcqSet.duration_minutes !==
                  null &&
                  " min"}
              </p>

            </div>


            {/* Attempts */}

            <div>

              <p className="text-xs text-slate-500">
                Maximum Attempts
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcqSet.max_attempts}
              </p>

            </div>


            {/* Passing */}

            <div>

              <p className="text-xs text-slate-500">
                Passing Percentage
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcqSet.passing_percentage ??
                  "—"}

                {mcqSet.passing_percentage !==
                  null &&
                  "%"}
              </p>

            </div>


            {/* Test Status */}

            <div>

              <p className="text-xs text-slate-500">
                Test Status
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcqSet.test_status}
              </p>

            </div>

          </div>


          {/* Shuffle */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              gap-3
            "
          >

            <span
              className="
                rounded-full
                bg-slate-100
                px-3
                py-1
                text-xs
                font-medium
                text-slate-600
                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              Questions:
              {" "}
              {mcqSet.shuffle_questions
                ? "Shuffled"
                : "Fixed Order"}
            </span>


            <span
              className="
                rounded-full
                bg-slate-100
                px-3
                py-1
                text-xs
                font-medium
                text-slate-600
                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              Options:
              {" "}
              {mcqSet.shuffle_options
                ? "Shuffled"
                : "Fixed Order"}
            </span>

          </div>

        </section>


        {/* =================================================
         * Attached Questions
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
                gap-4
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
                  Questions
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
                  Questions in this Set
                </h3>

              </div>


              <Link
                href={`/admin/mcq-bank/sets/${mcqSet.id}/questions`}
                className="
                  inline-flex
                  items-center
                  justify-center
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
                Manage Questions
              </Link>

            </div>

          </div>


          {isEmpty ? (

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
                  bg-blue-50
                  text-blue-700
                  dark:bg-blue-950
                  dark:text-blue-300
                "
              >
                <span className="text-xl font-bold">
                  ?
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
                No MCQs added yet
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
                This Set has been created, but no
                questions have been attached yet.
                Add MCQs from the MCQ Bank to build
                this Set.
              </p>


              <div className="mt-6">

                <Link
                  href={`/admin/mcq-bank/sets/${mcqSet.id}/questions`}
                  className="
                    inline-flex
                    items-center
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
                  "
                >
                  + Add MCQs
                </Link>

              </div>

            </div>

          ) : (

            /* =================================================
             * Question Table
             * ================================================= */

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  min-w-[900px]
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
                        px-5
                        py-4
                        text-sm
                        font-semibold
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      #
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
                      Question
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

                  {questions.map(
                    (question) => (

                      <tr
                        key={
                          question.question_id
                        }
                        className="
                          transition
                          hover:bg-slate-50
                          dark:hover:bg-slate-950/50
                        "
                      >

                        {/* Order */}

                        <td className="px-5 py-5">

                          <span
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              bg-slate-100
                              text-xs
                              font-bold
                              text-slate-700
                              dark:bg-slate-800
                              dark:text-slate-300
                            "
                          >
                            {
                              question.question_order
                            }
                          </span>

                        </td>


                        {/* Question */}

                        <td className="px-5 py-5">

                          <div className="max-w-2xl">

                            <div
                              className="
                                text-sm
                                font-semibold
                                leading-6
                                text-slate-900
                                dark:text-white
                              "
                            >
                              <MathTextPreview
                                value={
                                  question.question_text
                                }
                              />
                            </div>


                            <p
                              className="
                                mt-1
                                font-mono
                                text-xs
                                text-slate-500
                              "
                            >
                              {
                                question.question_id
                              }
                            </p>

                          </div>

                        </td>


                        {/* Difficulty */}

                        <td className="px-5 py-5">

                          <span
                            className="
                              text-sm
                              text-slate-700
                              dark:text-slate-300
                            "
                          >
                            {
                              question.difficulty ??
                              "—"
                            }
                          </span>

                        </td>


                        {/* Marks */}

                        <td className="px-5 py-5">

                          <span
                            className="
                              text-sm
                              text-slate-700
                              dark:text-slate-300
                            "
                          >
                            {
                              question.marks ??
                              question.question_marks ??
                              "—"
                            }
                          </span>

                        </td>


                        {/* Status */}

                        <td className="px-5 py-5">

                          <span
                            className={`
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${
                                question.status ===
                                "PUBLISHED"
                                  ? `
                                    bg-green-100
                                    text-green-700
                                    dark:bg-green-500/10
                                    dark:text-green-400
                                  `
                                  : `
                                    bg-slate-100
                                    text-slate-600
                                    dark:bg-slate-800
                                    dark:text-slate-300
                                  `
                              }
                            `}
                          >
                            {
                              question.status
                            }
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

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
            MCQs may remain in DRAFT status while
            they are being prepared and can still be
            attached to this Set. The Set itself is the
            publishing boundary for student-facing
            access. Review the questions and publish
            the Set when the content is ready.
            A Set must contain at least one MCQ before
            it can be published.
          </p>

        </section>

      </div>

    </AdminPage>
  );
}