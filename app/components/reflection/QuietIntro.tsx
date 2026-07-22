export default function QuietIntro() {
  return (
    <section
      id="quiet-introduction"
      aria-labelledby="quiet-intro-title"
      className="px-6 py-40 bg-white dark:bg-slate-950"
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Screen reader only heading */}
        <h2 id="quiet-intro-title" className="sr-only">
          About Reflection
        </h2>

        <div className="space-y-8">
          <p className="text-2xl font-medium leading-relaxed text-blue-900 dark:text-blue-400 md:text-3xl">
            Every page teaches something.
            <br />
            Few invite you to pause.
          </p>

          <p className="text-lg leading-9 text-slate-600 dark:text-slate-400">
            Reflection is a quiet space for questions that deserve more than
            quick answers—questions that ask for time, attention, and honesty.
          </p>

          <p className="text-lg leading-9 text-slate-600 dark:text-slate-400">
            Read slowly. You are not expected to agree.
            <br />
            <span className="font-medium text-blue-900 dark:text-blue-400">
              Only to observe what stays with you.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}