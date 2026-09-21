"use client";

import { useState } from "react";

import {
  addSubjectiveQuestionsToSet,
} from "@/app/lib/admin/subjective/subjective-set-questions.actions";

import type {
  AdminSubjectiveQuestion,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

import MathTextPreview from "@/app/admin/mcq-bank/components/MathTextPreview";

type Props = {
  setId: string;
  questions: AdminSubjectiveQuestion[];
};

export default function SubjectiveQuestionSelector({
  setId,
  questions,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected =
    questions.length > 0 &&
    selectedIds.length === questions.length;

  function toggleQuestion(questionId: string) {
    setSelectedIds((current) => {
      if (current.includes(questionId)) {
        return current.filter(
          (id) => id !== questionId
        );
      }

      return [...current, questionId];
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      questions.map(
        (question) => question.id
      )
    );
  }

  return (
    <form
      action={addSubjectiveQuestionsToSet}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="set_id"
        value={setId}
      />

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          sm:flex-row
          sm:items-center
          sm:justify-between
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Available Questions
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {questions.length} question
            {questions.length === 1 ? "" : "s"} available
          </p>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
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
              hover:border-slate-300
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            {allSelected
              ? "Clear Selection"
              : "Select All"}
          </button>
        )}
      </div>

      {/* =====================================================
          QUESTION LIST
          ===================================================== */}

      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((question) => {
            const checked =
              selectedIds.includes(question.id);

            return (
              <label
                key={question.id}
                className={`
                  block
                  cursor-pointer
                  rounded-2xl
                  border
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  dark:bg-slate-900
                  ${
                    checked
                      ? "border-blue-400 ring-1 ring-blue-400 dark:border-blue-500 dark:ring-blue-500"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    name="question_ids"
                    value={question.id}
                    checked={checked}
                    onChange={() =>
                      toggleQuestion(question.id)
                    }
                    className="
                      mt-1
                      h-4
                      w-4
                      shrink-0
                      rounded
                      border-slate-300
                      text-blue-700
                      focus:ring-blue-600
                    "
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                        Q{question.admin_question_number}
                      </span>

                      {question.difficulty && (
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
                          {question.difficulty}
                        </span>
                      )}

                      {question.marks !== null && (
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
                          {question.marks} marks
                        </span>
                      )}
                    </div>

                    {/* =================================================
                        MATHEMATICAL QUESTION PREVIEW
                        ================================================= */}

                    <div className="mt-3">
                      <MathTextPreview
                        value={question.question_text}
                        className="
                          text-sm
                          leading-7
                          text-slate-800
                          dark:text-slate-200
                        "
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {question.chapter_name ?? "Chapter"}
                      </span>

                      {question.source_type && (
                        <>
                          <span>·</span>

                          <span>
                            {question.source_type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* =====================================================
          SUBMIT BAR
          ===================================================== */}

      {questions.length > 0 && (
        <div
          className="
            sticky
            bottom-4
            z-10
            rounded-2xl
            border
            border-slate-200
            bg-white/95
            p-4
            shadow-lg
            backdrop-blur
            dark:border-slate-800
            dark:bg-slate-900/95
          "
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedIds.length} selected
            </p>

            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="
                rounded-xl
                bg-slate-900
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:bg-white
                dark:text-slate-900
                dark:hover:bg-slate-200
              "
            >
              Add Selected Questions
            </button>
          </div>
        </div>
      )}
    </form>
  );
}