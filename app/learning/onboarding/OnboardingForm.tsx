"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";

import {
  createStudentProfileAction,
} from "./actions";

type LearningProgram = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  status: string;
};

type OnboardingFormProps = {
  programs: LearningProgram[];
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

export default function OnboardingForm({
  programs,
}: OnboardingFormProps) {
  const [fullName, setFullName] =
    useState("");

  const [programId, setProgramId] =
    useState("");

  const [board, setBoard] =
    useState<Board | "">("");

  const [schoolName, setSchoolName] =
    useState("");

  const [preferredLanguage, setPreferredLanguage] =
    useState<Language>("English");

  const [errorMessage, setErrorMessage] =
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

        await createStudentProfileAction({
  fullName: fullName.trim(),
  programId,
  board,
  schoolName:
    schoolName.trim() || null,
  preferredLanguage,
});

        window.location.href = "/learning";
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to create your profile."
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

      {/* Name */}

      <div>
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
          placeholder="Enter your full name"
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
        />
      </div>


      {/* Class */}

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


      {/* Board */}

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


      {/* School */}

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
          placeholder="Enter your school name"
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
        />
      </div>


      {/* Language */}

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


      {/* Error */}

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


      {/* Submit */}

      <button
        type="submit"
        disabled={isPending}
        className="
          mt-8
          inline-flex
          w-full
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
          ? "Creating your learning space..."
          : "Continue to SanidhyaShala →"}
      </button>

    </form>
  );
}