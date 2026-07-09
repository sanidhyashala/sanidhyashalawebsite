export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-6 text-5xl font-bold text-blue-900 dark:text-blue-400">
        Contact
      </h1>

      <p className="mb-12 text-xl text-slate-600 dark:text-slate-300">
        Feel free to reach out for questions, collaborations,
        teaching inquiries, or thoughtful conversations.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-2xl font-semibold text-blue-900 dark:text-blue-400">
            Email
          </h2>

          <p className="text-lg text-slate-700 dark:text-slate-300">
            sanidhyashala.official@gmail.com
          </p>
        </section>

        <section>
          <p className="text-lg leading-8 text-slate-700 dark:text-slate-300">
            Whether you are a student, parent, educator, or a
            curious learner, I would be happy to hear from you.
          </p>
        </section>

        <section>
          <p className="italic text-slate-500 dark:text-slate-400">
            Learn. Teach. Reflect.
          </p>
        </section>
      </div>
    </main>
  );
}