export default function ReflectionGuidelines() {
  const guidelines = [
    "Write from your own experience, not from the desire to impress.",
    "Leave space for disagreement. Reflection is a conversation, not a conclusion.",
    "Respect every thoughtful voice, including those different from your own.",
  ];

  return (
    <section
      className="
        mt-10
        rounded-[2rem]
        border
        border-blue-100
        bg-blue-50/60
        p-8

        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-lg
        hover:shadow-blue-100/40

        dark:border-slate-800
        dark:bg-slate-900/40
        dark:hover:border-blue-500/30
        dark:hover:shadow-blue-900/20
      "
    >
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400">
        Before you offer your reflection
      </h3>

      <ul className="mt-6 space-y-5">
        {guidelines.map((item) => (
          <li
            key={item}
            className="
              flex
              items-start
              gap-3

              text-slate-700
              dark:text-slate-300
            "
          >
            <span className="mt-1 text-blue-600 dark:text-blue-400">
              🌿
            </span>

            <span className="leading-7">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}