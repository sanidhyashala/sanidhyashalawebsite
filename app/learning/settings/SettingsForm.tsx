"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";

import {
  updateStudentProfileAction,
} from "./actions";

type LearningProgram = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  status: string;
};

type Board =
  | "CBSE"
  | "ICSE"
  | "UP_BOARD"
  | "OTHER";

type Language =
  | "English"
  | "Hindi"
  | "Hinglish";

type StudentProfileData = {
  full_name: string;
  program_id: string;
  board: Board;
  school_name: string | null;
  preferred_language: Language;
};

type SettingsFormProps = {
  email: string;
  profile: StudentProfileData;
  programs: LearningProgram[];
};

export default function SettingsForm({
  email,
  profile,
  programs,
}: SettingsFormProps) {
  const [fullName, setFullName] =
    useState(profile.full_name);

  const [programId, setProgramId] =
    useState(profile.program_id);

  const [board, setBoard] =
    useState<Board>(profile.board);

  const [schoolName, setSchoolName] =
    useState(profile.school_name ?? "");

  const [preferredLanguage, setPreferredLanguage] =
    useState<Language>(
      profile.preferred_language
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage(
        "Please enter your full name."
      );
      return;
    }

    if (!programId) {
      setErrorMessage(
        "Please select your class."
      );
      return;
    }

    if (!board) {
      setErrorMessage(
        "Please select your board."
      );
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);

        await updateStudentProfileAction({
          fullName: fullName.trim(),
          programId,
          board,
          schoolName:
            schoolName.trim() || null,
          preferredLanguage,
        });

        setSuccessMessage(
          "Your learning profile has been updated."
        );

        /*
         * Return to dashboard after successful update.
         *
         * The dashboard will resolve the student's
         * current program again, so changing class here
         * changes the learning content automatically.
         */
        window.location.href = "/learning";
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to update your profile."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-8
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-none
      "
    >

      {/* =================================================
       * Account Email — NOT EDITABLE
       * ================================================= */}

      <div>
        <label
          htmlFor="email"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          Account Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          readOnly
          disabled
          aria-describedby="email-help"
          className="
            mt-2
            w-full
            cursor-not-allowed
            rounded-xl
            border
            border-slate-200
            bg-slate-100
            px-4
            py-3
            text-slate-600
            outline-none
            dark:border-slate-800
            dark:bg-slate-950
            dark:text-slate-400
          "
        />

        <p
          id="email-help"
          className="
            mt-2
            text-xs
            text-slate-500
            dark:text-slate-400
          "
        >
          This email is connected to your
          SanidhyaShala account and cannot be
          changed from Learning Settings.
        </p>
      </div>


      {/* =================================================
       * Full Name
       * ================================================= */}

      <div className="mt-6">
        <label
          htmlFor="full-name"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          Full Name
        </label>

        <input
          id="full-name"
          type="text"
          value={fullName}
          onChange={(event) =>
            setFullName(event.target.value)
          }
          disabled={isPending}
          placeholder="Enter your full name"
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
          "
        />
      </div>


      {/* =================================================
       * Class
       * ================================================= */}

      <div className="mt-6">
        <label
          htmlFor="program"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          Class
        </label>

        <select
          id="program"
          value={programId}
          onChange={(event) =>
            setProgramId(event.target.value)
          }
          disabled={isPending}
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
          "
        >
          <option value="">
            Select your class
          </option>

          {programs.map((program) => (
            <option
              key={program.id}
              value={program.id}
            >
              {program.name}
            </option>
          ))}
        </select>
      </div>


      {/* =================================================
       * Board
       * ================================================= */}

      <div className="mt-6">
        <label
          htmlFor="board"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          Board
        </label>

        <select
          id="board"
          value={board}
          onChange={(event) =>
            setBoard(
              event.target.value as Board
            )
          }
          disabled={isPending}
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
          "
        >
          <option value="">
            Select your board
          </option>

          <option value="CBSE">
            CBSE
          </option>

          <option value="ICSE">
            ICSE
          </option>

          <option value="UP_BOARD">
            UP Board
          </option>

          <option value="OTHER">
            Other
          </option>
        </select>
      </div>


      {/* =================================================
       * School
       * ================================================= */}

      <div className="mt-6">
        <label
          htmlFor="school-name"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          School Name

          <span
            className="
              ml-2
              font-normal
              text-slate-400
            "
          >
            Optional
          </span>
        </label>

        <input
          id="school-name"
          type="text"
          value={schoolName}
          onChange={(event) =>
            setSchoolName(event.target.value)
          }
          disabled={isPending}
          placeholder="Enter your school name"
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
          "
        />
      </div>


      {/* =================================================
       * Preferred Language
       * ================================================= */}

      <div className="mt-6">
        <label
          htmlFor="language"
          className="
            block
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          Preferred Language
        </label>

        <select
          id="language"
          value={preferredLanguage}
          onChange={(event) =>
            setPreferredLanguage(
              event.target.value as Language
            )
          }
          disabled={isPending}
          className="
            mt-2
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-slate-900
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
          "
        >
          <option value="English">
            English
          </option>

          <option value="Hindi">
            Hindi
          </option>

          <option value="Hinglish">
            Hinglish
          </option>
        </select>
      </div>


      {/* =================================================
       * Error
       * ================================================= */}

      {errorMessage && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            dark:border-red-900
            dark:bg-red-950/40
            dark:text-red-300
          "
        >
          {errorMessage}
        </div>
      )}


      {/* =================================================
       * Success
       * ================================================= */}

      {successMessage && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            text-green-700
            dark:border-green-900
            dark:bg-green-950/40
            dark:text-green-300
          "
        >
          {successMessage}
        </div>
      )}


      {/* =================================================
       * Actions
       * ================================================= */}

      <div
        className="
          mt-8
          flex
          flex-col
          gap-3
          sm:flex-row
        "
      >
        <button
          type="submit"
          disabled={isPending}
          className="
            inline-flex
            flex-1
            items-center
            justify-center
            rounded-xl
            bg-blue-700
            px-6
            py-3
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-blue-800
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-blue-600
            dark:hover:bg-blue-500
          "
        >
          {isPending
            ? "Saving changes..."
            : "Save Changes →"}
        </button>

        <a
          href="/learning"
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            border
            border-slate-300
            px-6
            py-3
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            dark:border-slate-700
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          Cancel
        </a>
      </div>

    </form>
  );
}