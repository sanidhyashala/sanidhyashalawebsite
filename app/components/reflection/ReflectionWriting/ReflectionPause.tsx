export default function ReflectionPause() {
  return (
    <section
      className="
        my-10

        rounded-[2rem]

        border-l-4
        border-blue-400

        bg-blue-50/60

        p-8

        shadow-sm

        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:shadow-md

        dark:border-blue-500
        dark:bg-blue-950/20
      "
    >
      <p
        className="
          text-lg
          leading-8
          italic

          text-blue-900

          dark:text-blue-200
        "
      >
        Before you offer your reflection,
        read it once as if someone else had written it.
      </p>
    </section>
  );
}