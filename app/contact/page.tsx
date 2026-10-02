import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MessageCircle,
  BookOpen,
  GraduationCap,
  HelpCircle,
} from "lucide-react";

import PageAtmosphere from "@/app/components/backgrounds/PageAtmosphere";

export const metadata: Metadata = {
  title: "Contact | SanidhyaShala",
  description:
    "Get in touch with SanidhyaShala for questions, teaching inquiries, collaborations, support, or thoughtful conversations.",
  alternates: {
    canonical: "/contact",
  },
};

const contactReasons = [
  {
    icon: <HelpCircle className="h-5 w-5" />,
    title: "Questions & Support",
    description:
      "Have a question about SanidhyaShala, your account, learning resources, or a technical issue? You can reach out to us.",
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Teaching & Learning",
    description:
      "For teaching-related inquiries, educational ideas, or questions about the learning experience, feel free to write to us.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Thoughtful Conversations",
    description:
      "SanidhyaShala is also a space for reflection, education, mathematics, philosophy, and ideas worth exploring slowly.",
  },
];

export default function ContactPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <PageAtmosphere type="contact" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-20 lg:py-24">
        {/* Hero */}
        <header className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-500 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
            <MessageCircle className="h-3.5 w-3.5" />
            Get in touch
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-blue-900 sm:text-5xl lg:text-6xl dark:text-blue-400">
            Contact
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
            Feel free to reach out for questions, collaborations, teaching
            inquiries, support, or simply a thoughtful conversation.
          </p>
        </header>

        {/* Contact card */}
        <section className="mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Email
              </p>

              <a
                href="mailto:sanidhyashala.official@gmail.com"
                className="mt-2 inline-block text-xl font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-300 dark:text-white dark:decoration-slate-700 dark:hover:text-blue-400 dark:hover:decoration-blue-700"
              >
                sanidhyashala.official@gmail.com
              </a>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                For account, learning, technical, payment, refund, or general
                inquiries, please include enough information for us to
                understand and respond to your request.
              </p>
            </div>
          </div>
        </section>

        {/* What you can contact us about */}
        <section className="mt-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-blue-900 sm:text-3xl dark:text-blue-400">
              What can you reach out about?
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Whether you are a student, parent, educator, or a curious
              learner, you are welcome to get in touch.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {contactReasons.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quiet closing */}
        <section className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
          <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Some conversations begin with a question. Others begin with
            curiosity. Either way, you are welcome here.
          </p>

          <p className="mt-5 text-sm italic text-slate-500 dark:text-slate-400">
            Learn. Teach. Reflect.
          </p>
        </section>

        {/* Legal/support links */}
        <nav
          aria-label="Legal and support links"
          className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:flex-wrap sm:items-center dark:border-slate-800"
        >
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            Privacy Policy
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            Terms of Service
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/refund-policy"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            Refund &amp; Cancellation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </main>
  );
}