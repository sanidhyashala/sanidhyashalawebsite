export default function ReflectionEmpty() {
  return (
    <section className="py-32 text-center">
      <div className="mx-auto max-w-2xl">

        <div
          className="
            mx-auto
            mb-8
            flex
            h-20
            w-20
            items-center
            justify-center

            rounded-full

            bg-blue-50
            text-4xl

            dark:bg-blue-950/30
          "
        >
          🌿
        </div>

        <h2
          className="
            text-4xl
            font-semibold
            tracking-tight

            text-blue-900
            dark:text-blue-400
          "
        >
          No Reflections Yet
        </h2>

        <p
          className="
            mx-auto
            mt-8
            max-w-2xl

            text-lg
            leading-9

            text-slate-600
            dark:text-slate-300
          "
        >
          Every thoughtful community begins with a single honest
          reflection. Someone has to begin the conversation.
          <br />
          <span
            className="
              font-medium
              text-slate-800
              dark:text-slate-200
            "
          >
            Perhaps yours will be the first.
          </span>
        </p>

      </div>
    </section>
  );
}