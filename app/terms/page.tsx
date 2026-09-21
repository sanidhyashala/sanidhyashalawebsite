import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | SanidhyaShala",
  description:
    "Terms and Conditions governing the use of SanidhyaShala.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of These Terms",
    content: (
      <>
        <p>
          Welcome to SanidhyaShala (“SanidhyaShala”, “we”, “us”, or “our”).
          These Terms and Conditions govern your access to and use of the
          SanidhyaShala website, Learning features, educational resources,
          evaluation services, and related functionality.
        </p>

        <p>
          By accessing or using SanidhyaShala, you agree to comply with these
          Terms. If you do not agree with them, please do not use the parts of
          the service to which these Terms apply.
        </p>

        <p>
          These Terms should be read together with our{" "}
          <Link
            href="/privacy"
            className="text-blue-700 underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },

  {
    id: "about",
    title: "2. About SanidhyaShala",
    content: (
      <>
        <p>
          SanidhyaShala is an educational platform created around learning,
          teaching, practice, reflection, and thoughtful engagement with
          knowledge.
        </p>

        <p>
          The platform may provide educational materials, practice questions,
          MCQs, Subjective Practice, teacher evaluation, feedback, reflective
          content, journal articles, and other learning experiences.
        </p>

        <p>
          Features may change, expand, or be discontinued as SanidhyaShala
          develops.
        </p>
      </>
    ),
  },

  {
    id: "accounts",
    title: "3. Accounts and Authentication",
    content: (
      <>
        <p>
          Some SanidhyaShala features require an authenticated account.
          Authentication and account-management functionality may be provided
          through a third-party authentication service.
        </p>

        <p>
          You are responsible for providing information that is reasonably
          accurate and for using your account in a responsible manner.
        </p>

        <p>
          You must not knowingly use another person&apos;s account, attempt to
          bypass authentication or access controls, or allow your account to be
          used for unauthorized purposes.
        </p>

        <p>
          We may restrict or suspend access where reasonably necessary to
          protect the platform, its users, educational content, or security.
        </p>
      </>
    ),
  },

  {
    id: "learning-content",
    title: "4. Learning Content and Educational Use",
    content: (
      <>
        <p>
          SanidhyaShala provides educational material for personal learning and
          educational use.
        </p>

        <p>
          Access to a resource does not transfer ownership of that resource to
          the user. Unless expressly permitted, users must not reproduce,
          redistribute, resell, publicly publish, or commercially exploit
          SanidhyaShala content.
        </p>

        <p>
          Educational material may include questions, solutions, explanations,
          notes, illustrations, tests, feedback, journal articles, and other
          original or appropriately licensed content.
        </p>

        <p>
          We may update, correct, reorganize, replace, or remove educational
          material as the platform evolves.
        </p>
      </>
    ),
  },

  {
    id: "subjective-practice",
    title: "5. Subjective Practice and Submissions",
    content: (
      <>
        <p>
          SanidhyaShala may allow learners to submit written solutions for
          Subjective Practice and evaluation.
        </p>

        <p>
          Submitted work may include photographs, images, typed responses, or
          PDF files, depending on the relevant feature.
        </p>

        <p>
          You should submit only material that is relevant to the educational
          activity and that you are permitted to submit.
        </p>

        <p>
          Once an attempt has been finally submitted and locked, the submission
          may no longer be editable through the relevant workflow.
        </p>

        <p>
          Users must not knowingly submit another person&apos;s work while
          representing it as their own.
        </p>
      </>
    ),
  },

  {
    id: "teacher-evaluation",
    title: "6. Teacher Evaluation and Feedback",
    content: (
      <>
        <p>
          Where teacher evaluation is available, submitted work may be reviewed
          by an authorized teacher or administrator.
        </p>

        <p>
          Teacher evaluation may include marks, feedback, annotations, notes,
          ideal solutions, and other educational observations.
        </p>

        <p>
          Evaluation is intended to support learning and improvement. Marks and
          feedback should not be understood as a guarantee of performance in
          any external examination or future assessment.
        </p>

        <p>
          Evaluation records may be retained as part of the learner&apos;s
          learning and evaluation history.
        </p>
      </>
    ),
  },

  {
    id: "ai-assistance",
    title: "7. AI-Assisted Evaluation",
    content: (
      <>
        <p>
          SanidhyaShala may use an external AI service to assist with certain
          educational evaluations.
        </p>

        <p>
          Where enabled, relevant question information and submitted answer
          material may be processed by the configured AI service to generate
          suggested marks, feedback, or structured analysis.
        </p>

        <p>
          AI-generated output is intended as assistance and should not be
          treated as an independent guarantee that an answer has been evaluated
          correctly.
        </p>

        <p>
          Where teacher evaluation is part of the workflow, the teacher remains
          the final authority for the evaluation and final marks.
        </p>

        <p>
          Additional information about AI-assisted processing is described in
          our{" "}
          <Link
            href="/privacy"
            className="text-blue-700 underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },

  {
    id: "acceptable-use",
    title: "8. Acceptable Use",
    content: (
      <>
        <p>
          You agree to use SanidhyaShala lawfully and in a manner that does not
          interfere with the rights, security, or normal operation of the
          platform or other users.
        </p>

        <p>You must not:</p>

        <ul>
          <li>
            attempt to gain unauthorized access to accounts, systems, APIs,
            databases, storage, or administrative functionality;
          </li>

          <li>
            bypass access controls, entitlement checks, authentication, or other
            technical restrictions;
          </li>

          <li>
            scrape, copy, systematically extract, or redistribute substantial
            amounts of platform content without permission;
          </li>

          <li>
            upload malicious software, harmful code, or files intended to
            compromise the platform;
          </li>

          <li>
            misuse another learner&apos;s personal information or submitted
            work;
          </li>

          <li>
            interfere with the availability, integrity, or security of the
            service; or
          </li>

          <li>
            use SanidhyaShala for unlawful or fraudulent activity.
          </li>
        </ul>
      </>
    ),
  },

  {
    id: "intellectual-property",
    title: "9. Intellectual Property",
    content: (
      <>
        <p>
          Unless otherwise stated, SanidhyaShala and its original content,
          including its branding, design, written material, educational
          resources, software, interface elements, and original editorial
          content, are protected by applicable intellectual-property laws.
        </p>

        <p>
          Using SanidhyaShala does not grant you ownership of the platform or
          its content.
        </p>

        <p>
          You retain rights you already have in material that you independently
          create and submit, subject to the permissions necessary for
          SanidhyaShala to provide the relevant learning and evaluation
          service.
        </p>

        <p>
          By submitting educational work for evaluation, you give SanidhyaShala
          the limited permission necessary to store, process, display, review,
          evaluate, and provide feedback on that work as part of the relevant
          service.
        </p>
      </>
    ),
  },

  {
    id: "third-party-services",
    title: "10. Third-Party Services",
    content: (
      <>
        <p>
          SanidhyaShala depends on third-party services and infrastructure to
          provide certain functionality.
        </p>

        <p>
          These may include authentication, database and storage
          infrastructure, email delivery, application hosting, domain
          registration, and AI-assisted processing services.
        </p>

        <p>
          Your use of SanidhyaShala may therefore involve processing by those
          service providers in accordance with the applicable service and
          privacy arrangements described in our Privacy Policy.
        </p>

        <p>
          Third-party services may have their own terms, policies, availability
          limitations, and technical requirements.
        </p>
      </>
    ),
  },

  {
    id: "availability",
    title: "11. Availability and Changes to the Service",
    content: (
      <>
        <p>
          We aim to keep SanidhyaShala available and reliable, but we do not
          guarantee that the platform will always be uninterrupted, error-free,
          or available at every moment.
        </p>

        <p>
          Maintenance, security incidents, infrastructure failures, updates,
          third-party service interruptions, or other circumstances may
          temporarily affect availability.
        </p>

        <p>
          We may add, modify, suspend, or remove features as SanidhyaShala
          develops.
        </p>
      </>
    ),
  },

  {
    id: "educational-disclaimer",
    title: "12. Educational Disclaimer",
    content: (
      <>
        <p>
          SanidhyaShala is intended to support learning and educational
          practice. Educational content and evaluations are provided for
          learning purposes and should be used together with appropriate
          teaching, study, and examination guidance.
        </p>

        <p>
          We make reasonable efforts to maintain accuracy, but we do not
          guarantee that every educational resource will always be completely
          free from errors or omissions.
        </p>

        <p>
          Users should use appropriate judgment and, where necessary, verify
          important academic information with qualified teachers, official
          curriculum material, textbooks, or examination authorities.
        </p>
      </>
    ),
  },

  {
    id: "account-restriction",
    title: "13. Suspension or Termination",
    content: (
      <>
        <p>
          We may suspend, restrict, or terminate access to an account or
          particular features when reasonably necessary, including where there
          is suspected misuse, unauthorized access, fraud, security risk,
          violation of these Terms, or a requirement to protect the platform or
          its users.
        </p>

        <p>
          Where reasonably appropriate, we may provide notice or an opportunity
          to address the issue before restricting access.
        </p>

        <p>
          Termination or suspension does not necessarily require immediate
          deletion of records that we are permitted or required to retain under
          our Privacy Policy or applicable law.
        </p>
      </>
    ),
  },

  {
    id: "limitation",
    title: "14. Limitation of Liability",
    content: (
      <>
        <p>
          To the extent permitted by applicable law, SanidhyaShala will not be
          responsible for losses arising from temporary service interruptions,
          third-party service failures, unauthorized actions outside our
          reasonable control, or reliance on educational content or automated
          evaluation output.
        </p>

        <p>
          Nothing in these Terms is intended to exclude or limit any liability
          that cannot lawfully be excluded or limited under applicable law.
        </p>
      </>
    ),
  },

  {
    id: "changes-terms",
    title: "15. Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms when SanidhyaShala changes, new features
          are introduced, or legal or operational requirements change.
        </p>

        <p>
          When material changes are made, we will update the date shown on this
          page and, where appropriate, provide additional notice.
        </p>

        <p>
          Continued use of SanidhyaShala after an updated version becomes
          effective means that you acknowledge the updated Terms, subject to
          applicable law.
        </p>
      </>
    ),
  },

  {
  id: "governing-law",
  title: "16. Governing Law",
  content: (
    <>
      <p>
        These Terms are governed by the laws of India, subject to any
        mandatory rights or protections available to users under applicable
        law.
      </p>

      <p>
        Any dispute should first, where reasonably possible, be brought to
        our attention so that we can attempt to resolve it directly.
      </p>
    </>
  ),
},

  {
  id: "contact",
  title: "17. Contact",
  content: (
    <>
      <p>
        If you have questions about these Terms or the operation of
        SanidhyaShala, please contact us.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="font-medium text-slate-900">
          SanidhyaShala
        </p>

        <p className="mt-2 text-slate-600">
          Email:{" "}
          <a
            href="mailto:sanidhyashala.official@gmail.com"
            className="text-blue-700 underline underline-offset-4"
          >
            sanidhyashala.official@gmail.com
          </a>
        </p>
      </div>
    </>
  ),
},
];

export default function TermsPage() {
  return (
    <main className="relative isolate overflow-hidden bg-white">
      {/* Subtle mathematical atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
      >
        <svg
          viewBox="0 0 1440 420"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 300 C 180 180, 340 380, 620 230 S 1060 80, 1540 210"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-blue-100"
          />

          <path
            d="M-100 350 C 220 250, 420 410, 720 260 S 1110 130, 1540 250"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-100"
          />
        </svg>
      </div>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-blue-700">
            Legal
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Terms &amp; Conditions
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            The terms that govern access to and use of SanidhyaShala.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: September 15, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <p className="text-sm leading-7 text-slate-700">
            These Terms are intended to keep SanidhyaShala a respectful,
            reliable, and focused educational space while making clear how
            learning resources, submissions, evaluations, and accounts may be
            used.
          </p>
        </div>

        {/* Table of contents */}
        <nav
          aria-label="Terms and Conditions sections"
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            On this page
          </h2>

          <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 border-b border-slate-200 pb-12 last:border-b-0"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {section.title}
              </h2>

              <div className="mt-5 space-y-5 text-[15px] leading-7 text-slate-600 [&_h3]:pt-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:pl-1 [&_li]:marker:text-slate-400 [&_ul]:list-disc [&_ul]:space-y-2">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer navigation */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            ← Back to SanidhyaShala
          </Link>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-slate-600 transition hover:text-blue-700"
            >
              Privacy Policy
            </Link>

            <Link
              href="/refund-policy"
              className="text-slate-600 transition hover:text-blue-700"
            >
              Refund &amp; Cancellation
            </Link>

            <Link
              href="/contact"
              className="text-slate-600 transition hover:text-blue-700"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}