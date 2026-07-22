import { ReflectionWritingProps } from "./types";

export default function ReflectionPrompt({
  isOpen,
  onOpen,
}: ReflectionWritingProps) {
  return (
    <section
      aria-labelledby="reflection-writing-title"
      className="py-20 text-center"
    >
      <p
        className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.28em]
          text-blue-600
          dark:text-blue-400
        "
      >
        Your Reflection
      </p>

      <h2
        id="reflection-writing-title"
        className="
          mt-6
          text-3xl
          font-semibold
          tracking-tight
          text-blue-900
          md:text-4xl

          dark:text-blue-400
        "
      >
        Every thoughtful voice
        <br />
        begins with an honest moment.
      </h2>

      <p
        className="
          mx-auto
          mt-8
          max-w-xl
          text-lg
          leading-8
          text-slate-600
          dark:text-slate-300
        "
      >
        You do not need perfect words.
        You do not need perfect answers.
        Simply write what stayed with you after reading.
      </p>

      {!isOpen && (
        <button
          onClick={onOpen}
          className="
            mt-12

            rounded-full

            bg-blue-900
            px-8
            py-4

            font-medium
            text-white

            transition-all
            duration-300

            hover:-translate-y-0.5
            hover:bg-blue-800
            hover:shadow-lg
            hover:shadow-blue-500/20

            active:translate-y-0

            dark:bg-blue-600
            dark:hover:bg-blue-500
            dark:hover:shadow-blue-500/30

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:ring-offset-2
            dark:focus-visible:ring-offset-slate-900
          "
        >
          Begin My Reflection
        </button>
      )}
    </section>
  );
}