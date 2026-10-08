"use client";

import { useMemo, useState } from "react";

/* =========================================================
 * Curriculum Types
 * ========================================================= */

type CurriculumChapter = {
  id: string;
  display_name: string;
  sequence_order: number | null;
};

type CurriculumBranch = {
  id: string;
  display_name: string;
  sequence_order: number | null;
  chapters: CurriculumChapter[];
};

/*
 * IMPORTANT:
 *
 * Subject itself is the raw curriculum node coming from
 * getAdminLearningCurriculum().
 *
 * Its chapters and branches are handled separately inside
 * CurriculumSubjectGroup.
 */
type CurriculumSubject = {
  id: string;
  display_name: string;
  sequence_order: number | null;
};

type CurriculumSubjectGroup = {
  subject: CurriculumSubject;
  chapters: CurriculumChapter[];
  branches: CurriculumBranch[];
};

type CurriculumGroup = {
  programId: string;
  programName: string;
  programSlug: string;
  session: string;
  curriculumVersionId: string;

  subjectGroups: CurriculumSubjectGroup[];

  unmappedChapters: CurriculumChapter[];
};

/* =========================================================
 * Component
 * ========================================================= */

export default function LearningCurriculumSelector({
  groups,
}: {
  groups: CurriculumGroup[];
}) {
  /* =======================================================
   * Selection State
   * ======================================================= */

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState("");

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] = useState("");

  const [
    selectedChapterId,
    setSelectedChapterId,
  ] = useState("");

  /* =======================================================
   * Selected Class
   * ======================================================= */

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (group) =>
          group.curriculumVersionId ===
          selectedGroupId,
      ) ?? null,
    [groups, selectedGroupId],
  );

  /* =======================================================
   * Available Subjects
   * ======================================================= */

  const availableSubjects =
    selectedGroup?.subjectGroups ?? [];

  /* =======================================================
   * Selected Subject
   * ======================================================= */

  const selectedSubjectGroup =
    useMemo(
      () =>
        availableSubjects.find(
          (item) =>
            item.subject.id ===
            selectedSubjectId,
        ) ?? null,
      [
        availableSubjects,
        selectedSubjectId,
      ],
    );

  const selectedSubject =
    selectedSubjectGroup?.subject ?? null;

  /* =======================================================
   * Available Branches
   * ======================================================= */

  const availableBranches =
    selectedSubjectGroup?.branches ?? [];

  /* =======================================================
   * Selected Branch
   * ======================================================= */

  const selectedBranch = useMemo(
    () =>
      availableBranches.find(
        (branch) =>
          branch.id ===
          selectedBranchId,
      ) ?? null,
    [
      availableBranches,
      selectedBranchId,
    ],
  );

  /* =======================================================
   * Available Chapters
   *
   * Mathematics:
   *
   *   Subject
   *      ↓
   *   Chapter
   *
   * Science:
   *
   *   Subject
   *      ↓
   *   Branch
   *      ↓
   *   Chapter
   * ======================================================= */

  const availableChapters =
    useMemo(() => {
      if (!selectedSubjectGroup) {
        return [];
      }

      /*
       * If the selected subject contains branches,
       * the chapter list comes from the selected branch.
       */

      if (availableBranches.length > 0) {
        return (
          selectedBranch?.chapters ?? []
        );
      }

      /*
       * Otherwise the subject directly owns
       * the chapters.
       */

      return selectedSubjectGroup.chapters;
    }, [
      selectedSubjectGroup,
      availableBranches,
      selectedBranch,
    ]);

  /* =======================================================
   * Selected Chapter
   * ======================================================= */

  const selectedChapter =
    useMemo(
      () =>
        availableChapters.find(
          (chapter) =>
            chapter.id ===
            selectedChapterId,
        ) ?? null,
      [
        availableChapters,
        selectedChapterId,
      ],
    );

  /* =======================================================
   * Class Change
   * ======================================================= */

  function handleClassChange(
    value: string,
  ) {
    setSelectedGroupId(value);

    /*
     * Changing the class invalidates
     * all lower-level selections.
     */

    setSelectedSubjectId("");
    setSelectedBranchId("");
    setSelectedChapterId("");
  }

  /* =======================================================
   * Subject Change
   * ======================================================= */

  function handleSubjectChange(
    value: string,
  ) {
    setSelectedSubjectId(value);

    /*
     * Changing the subject invalidates
     * branch and chapter.
     */

    setSelectedBranchId("");
    setSelectedChapterId("");
  }

  /* =======================================================
   * Branch Change
   * ======================================================= */

  function handleBranchChange(
    value: string,
  ) {
    setSelectedBranchId(value);

    /*
     * Changing the branch invalidates
     * the selected chapter.
     */

    setSelectedChapterId("");
  }

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <div>
      {/* =================================================
          Class
      ================================================= */}

      <div>
        <label
          htmlFor="learning-class"
          className="
            block
            text-sm
            font-semibold
            text-slate-800
            dark:text-slate-200
          "
        >
          Class
        </label>

        <select
          id="learning-class"
          value={selectedGroupId}
          onChange={(event) =>
            handleClassChange(
              event.target.value,
            )
          }
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
            dark:focus:ring-blue-950
          "
        >
          <option value="">
            Select class
          </option>

          {groups.map((group) => (
            <option
              key={
                group.curriculumVersionId
              }
              value={
                group.curriculumVersionId
              }
            >
              {group.programName}
              {group.session
                ? ` — ${group.session}`
                : ""}
            </option>
          ))}
        </select>

        <p
          className="
            mt-2
            text-xs
            text-slate-500
            dark:text-slate-400
          "
        >
          Select the class first.
        </p>
      </div>

      {/* =================================================
          Subject
      ================================================= */}

      <div className="mt-5">
        <label
          htmlFor="learning-subject"
          className="
            block
            text-sm
            font-semibold
            text-slate-800
            dark:text-slate-200
          "
        >
          Subject
        </label>

        <select
          id="learning-subject"
          value={selectedSubjectId}
          onChange={(event) =>
            handleSubjectChange(
              event.target.value,
            )
          }
          disabled={!selectedGroup}
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
            dark:focus:ring-blue-950
          "
        >
          <option value="">
            {selectedGroup
              ? "Select subject"
              : "Select class first"}
          </option>

          {availableSubjects.map(
            (subjectGroup) => (
              <option
                key={
                  subjectGroup.subject.id
                }
                value={
                  subjectGroup.subject.id
                }
              >
                {
                  subjectGroup.subject
                    .display_name
                }
              </option>
            ),
          )}
        </select>
      </div>

      {/* =================================================
          Branch
      ================================================= */}

      {selectedSubject &&
        availableBranches.length > 0 && (
          <div className="mt-5">
            <label
              htmlFor="learning-branch"
              className="
                block
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              {selectedSubject.display_name}{" "}
              Branch
            </label>

            <select
              id="learning-branch"
              value={selectedBranchId}
              onChange={(event) =>
                handleBranchChange(
                  event.target.value,
                )
              }
              disabled={!selectedSubject}
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-white
                dark:focus:ring-blue-950
              "
            >
              <option value="">
                Select branch
              </option>

              {availableBranches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.display_name}
                  </option>
                ),
              )}
            </select>

            <p
              className="
                mt-2
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              Select the appropriate branch
              before choosing a chapter.
            </p>
          </div>
        )}

      {/* =================================================
          Chapter
      ================================================= */}

      <div className="mt-5">
        <label
          htmlFor="curriculum_node_id"
          className="
            block
            text-sm
            font-semibold
            text-slate-800
            dark:text-slate-200
          "
        >
          Chapter
        </label>

        <select
          id="curriculum_node_id"
          name="curriculum_node_id"
          value={selectedChapterId}
          onChange={(event) =>
            setSelectedChapterId(
              event.target.value,
            )
          }
          disabled={
            !selectedSubject ||
            (availableBranches.length > 0 &&
              !selectedBranch)
          }
          required
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
            dark:focus:ring-blue-950
          "
        >
          <option value="">
            {!selectedGroup
              ? "Select class first"
              : !selectedSubject
                ? "Select subject first"
                : availableBranches.length >
                      0 &&
                    !selectedBranch
                  ? "Select branch first"
                  : "Select a chapter"}
          </option>

          {availableChapters.map(
            (chapter) => (
              <option
                key={chapter.id}
                value={chapter.id}
              >
                Chapter{" "}
                {chapter.sequence_order ??
                  "—"}{" "}
                —{" "}
                {chapter.display_name}
              </option>
            ),
          )}
        </select>

        {selectedSubject &&
          availableChapters.length === 0 && (
            <p
              className="
                mt-2
                text-xs
                text-red-600
                dark:text-red-400
              "
            >
              No active chapters are
              available for the selected
              curriculum.
            </p>
          )}
      </div>

      {/* =================================================
          Curriculum Mapping Preview
      ================================================= */}

      {selectedGroup &&
        selectedSubject &&
        selectedChapter && (
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-blue-100
              bg-blue-50
              p-4
              dark:border-blue-900/50
              dark:bg-blue-950/20
            "
          >
            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-wider
                text-blue-700
                dark:text-blue-300
              "
            >
              Curriculum Mapping
            </p>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-blue-900
                dark:text-blue-200
              "
            >
              {selectedGroup.programName}
              {" · "}
              {selectedSubject.display_name}

              {selectedBranch
                ? ` · ${selectedBranch.display_name}`
                : ""}

              {" · "}
              {selectedChapter.display_name}
            </p>

            <p
              className="
                mt-1
                text-xs
                text-blue-700
                dark:text-blue-400
              "
            >
              Session:{" "}
              {selectedGroup.session ||
                "—"}
            </p>

            <p
              className="
                mt-2
                text-xs
                font-medium
                text-blue-700
                dark:text-blue-400
              "
            >
              Chapter Node ID:{" "}
              <span className="font-mono font-bold">
                {selectedChapter.id}
              </span>
            </p>

            <p
              className="
                mt-2
                text-xs
                text-blue-700
                dark:text-blue-400
              "
            >
              This exact chapter node will
              be linked to the Note.
            </p>
          </div>
        )}
    </div>
  );
}