import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | SanidhyaShala",
  description:
    "Privacy Policy for SanidhyaShala — how we collect, use, store, and protect information.",
};

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <>
        <p>
          SanidhyaShala (“SanidhyaShala”, “we”, “us”, or “our”) is a learning
          platform designed around learning, teaching, practice, reflection,
          and thoughtful education.
        </p>

        <p>
          This Privacy Policy explains what information we may collect when you
          use SanidhyaShala, how we use that information, how it may be shared
          with service providers that help us operate the platform, and the
          choices available to you.
        </p>

        <p>
          We aim to collect and use information only to the extent reasonably
          necessary to provide, secure, support, and improve SanidhyaShala and
          its services.
        </p>
      </>
    ),
  },

  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: (
      <>
        <h3>Account and authentication information</h3>

        <p>
          When you create or use a SanidhyaShala account, authentication and
          account-management information may be processed through our
          authentication provider. This may include information such as your
          name, email address, user identifier, and authentication-related
          information.
        </p>

        <h3>Learning profile information</h3>

        <p>
          Depending on the features you use, we may collect information
          associated with your learning profile, such as your selected program,
          board, school information, preferred language, and onboarding
          information.
        </p>

        <h3>Learning activity</h3>

        <p>
          We may store information about your activity on the Learning module,
          including practice attempts, questions, submissions, evaluations,
          marks, feedback, and related learning records.
        </p>

        <h3>Submitted solutions and files</h3>

        <p>
          When you submit work for Subjective Practice or evaluation, you may
          provide photographs, images, or PDF files containing your written
          solutions.
        </p>

        <p>
          These files may be stored as part of the relevant learning and
          evaluation record and may be accessed by authorized systems and
          personnel for the purposes described in this Policy.
        </p>

        <h3>Evaluation information</h3>

        <p>
          Subjective evaluations may contain marks, teacher feedback,
          annotations, notes, ideal solutions, evaluation status, and
          evaluation history.
        </p>

        <h3>Communication information</h3>

        <p>
          If we send you transactional or service-related emails, we may
          process your email address and information necessary to deliver those
          communications.
        </p>

        <h3>Technical information</h3>

        <p>
          Like most web applications, SanidhyaShala and the infrastructure
          supporting it may process technical information such as IP-related
          information, browser or device information, request information,
          timestamps, logs, and security-related information.
        </p>
      </>
    ),
  },

  {
    id: "how-we-use",
    title: "3. How We Use Information",
    content: (
      <>
        <p>We may use information to:</p>

        <ul>
          <li>create and manage user accounts;</li>
          <li>provide access to learning resources and features;</li>
          <li>save and resume learning activity and attempts;</li>
          <li>receive and store submitted solutions;</li>
          <li>provide teacher evaluation and feedback;</li>
          <li>provide AI-assisted evaluation where enabled;</li>
          <li>send necessary service-related communications;</li>
          <li>maintain the security and reliability of the platform;</li>
          <li>detect misuse, fraud, or unauthorized activity;</li>
          <li>troubleshoot technical problems;</li>
          <li>maintain records necessary for legitimate operational purposes;</li>
          <li>comply with applicable legal obligations; and</li>
          <li>improve the quality and usability of SanidhyaShala.</li>
        </ul>

        <p>
          We do not intend to use submitted educational work for unrelated
          advertising purposes.
        </p>
      </>
    ),
  },

  {
    id: "subjective-evaluation",
    title: "4. Subjective Evaluation and AI-Assisted Evaluation",
    content: (
      <>
        <p>
          SanidhyaShala may provide Subjective Practice in which a learner
          submits written solutions for evaluation.
        </p>

        <p>
          Depending on the feature and evaluation workflow, submitted answers
          may be reviewed by an authorized teacher or administrator and may
          also be processed by an AI-assisted evaluation service configured by
          SanidhyaShala.
        </p>

        <h3>AI-assisted evaluation</h3>

        <p>
          When AI-assisted evaluation is used as part of an authorized
          evaluation workflow, relevant information may be transmitted to the
          configured AI service for the purpose of assisting with evaluation.
          This may include:
        </p>

        <ul>
          <li>the question being evaluated;</li>
          <li>the maximum marks for the question;</li>
          <li>the relevant ideal or reference solution;</li>
          <li>relevant mistake or concept guidance;</li>
          <li>typed student answer text, where available; and</li>
          <li>images or PDF files containing the submitted solution.</li>
        </ul>

        <p>
          AI-generated evaluation may produce suggested marks, feedback,
          strengths, mistakes, missing steps, reasoning about the score, and
          other structured analysis.
        </p>

        <p>
          AI assistance does not replace teacher judgment. Where teacher
          evaluation is provided, the teacher remains responsible for the
          final evaluation and marks.
        </p>

        <p>
          AI evaluation results may be stored as part of the evaluation record
          and may also form part of an evaluation audit history.
        </p>

        <p>
          AI services and their applicable terms may change as SanidhyaShala
          evolves. We will update this Policy when a material change affects
          how learner information is processed.
        </p>
      </>
    ),
  },

  {
    id: "storage-security",
    title: "5. Storage and Security",
    content: (
      <>
        <p>
          SanidhyaShala uses third-party infrastructure to store and process
          application data, including learning records and submitted solution
          files.
        </p>

        <p>
          Submitted solution files are stored in a private storage environment.
          Access to files may be provided through controlled, time-limited
          access mechanisms rather than making the underlying storage location
          publicly accessible.
        </p>

        <p>
          We use reasonable technical and organizational measures intended to
          protect information against unauthorized access, alteration, loss,
          misuse, or disclosure.
        </p>

        <p>
          However, no internet-connected service can guarantee absolute
          security. We cannot promise that information will always remain
          completely secure against every possible security incident.
        </p>
      </>
    ),
  },

  {
    id: "service-providers",
    title: "6. Third-Party Service Providers",
    content: (
      <>
        <p>
          SanidhyaShala relies on selected third-party services to operate the
          platform. These providers may process information on our behalf or
          provide infrastructure necessary for the service.
        </p>

        <div className="space-y-6">
          <div>
            <h3>Clerk</h3>
            <p>
              We use Clerk for authentication and account-related functionality.
              Information necessary to authenticate and manage accounts may be
              processed through Clerk.
            </p>
          </div>

          <div>
            <h3>Supabase</h3>
            <p>
              We use Supabase for application database infrastructure and
              private file storage. Learning records, evaluation records, and
              submitted solution files may therefore be processed through
              Supabase.
            </p>
          </div>

          <div>
            <h3>Resend</h3>
            <p>
              We use Resend to deliver transactional and service-related
              emails. For example, when a teacher completes a Subjective
              evaluation, SanidhyaShala may send the learner an email notifying
              them that their evaluation is available.
            </p>
          </div>

          <div>
            <h3>Vercel</h3>
            <p>
              We use Vercel for application deployment and hosting
              infrastructure. Technical information, request information, and
              application traffic may therefore be processed through the
              infrastructure supporting SanidhyaShala.
            </p>
          </div>

          <div>
            <h3>Hostinger</h3>
            <p>
              Our domain registration is managed through Hostinger. Hostinger
              is not our primary application database or student-file storage
              provider.
            </p>
          </div>

          <div>
            <h3>AI service providers</h3>
            <p>
              SanidhyaShala may use an external AI service to provide
              AI-assisted educational evaluation. When such functionality is
              enabled as part of an authorized evaluation workflow, relevant
              information described in the AI-Assisted Evaluation section may
              be transmitted to the configured provider.
            </p>
          </div>
        </div>

        <p>
          We do not sell learner information to third parties.
        </p>
      </>
    ),
  },

  {
    id: "emails",
    title: "7. Service Emails",
    content: (
      <>
        <p>
          We may send transactional or service-related emails when necessary
          to operate SanidhyaShala.
        </p>

        <p>
          For example, after a Subjective evaluation has been completed, we may
          send an email informing the learner that the checked work, marks, and
          evaluation are available.
        </p>

        <p>
          These communications are intended to support the service and are not
          intended to function as unrelated promotional advertising.
        </p>
      </>
    ),
  },

  {
    id: "minors",
    title: "8. Students and Younger Learners",
    content: (
      <>
        <p>
          SanidhyaShala is an educational platform and may be used by students
          in secondary and senior-secondary education.
        </p>

        <p>
          We recognize that some learners using educational services may be
          under 18. We therefore aim to handle learner information carefully
          and use it only for legitimate platform, learning, evaluation,
          communication, security, and legal purposes.
        </p>

        <p>
          Parents or legal guardians who have questions about information
          associated with a learner may contact us using the contact details
          provided below.
        </p>

        <p>
          If we become aware that information has been collected or processed
          in a manner that is inconsistent with applicable requirements for
          minors, we will take appropriate steps to review and address the
          situation.
        </p>
      </>
    ),
  },

  {
    id: "retention",
    title: "9. Data Retention",
    content: (
      <>
        <p>
          We retain information for as long as reasonably necessary for the
          purposes for which it was collected, including providing learning
          services, maintaining evaluation history, resolving disputes,
          maintaining security, and meeting legal or operational requirements.
        </p>

        <p>
          Different categories of information may therefore be retained for
          different periods.
        </p>

        <p>
          We do not state a single fixed deletion period for all learning
          information because retention may depend on the type of record, the
          learner&apos;s account, evaluation history, legal requirements, and
          operational needs.
        </p>

        <p>
          Where appropriate, you may contact us to request information about
          the handling or deletion of information associated with your
          account, subject to applicable legal and operational requirements.
        </p>
      </>
    ),
  },

  {
    id: "cookies",
    title: "10. Cookies and Similar Technologies",
    content: (
      <>
        <p>
          SanidhyaShala may use cookies, local storage, session mechanisms, or
          similar technologies that are necessary for authentication, security,
          preferences, and reliable operation of the website.
        </p>

        <p>
          Third-party infrastructure used by the platform may also process
          technical information associated with requests and application
          operation.
        </p>

        <p>
          We do not currently describe every technical cookie or storage
          mechanism individually in this Policy because these mechanisms may
          change as the platform evolves.
        </p>
      </>
    ),
  },

  {
    id: "your-choices",
    title: "11. Your Choices and Privacy Requests",
    content: (
      <>
        <p>
          Depending on applicable law and the nature of the information, you
          may contact us to ask about:
        </p>

        <ul>
          <li>the personal information associated with your account;</li>
          <li>correction of inaccurate account information;</li>
          <li>
            deletion of information where deletion is legally and
            operationally possible;
          </li>
          <li>questions about how submitted learning work is processed; or</li>
          <li>
            questions about third-party service providers involved in the
            platform.
          </li>
        </ul>

        <p>
          Some information may need to be retained where required for legal,
          security, fraud-prevention, dispute-resolution, or legitimate
          operational purposes.
        </p>
      </>
    ),
  },

  {
    id: "children-safety",
    title: "12. Safety and Responsible Use",
    content: (
      <>
        <p>
          SanidhyaShala is intended to provide a focused educational
          environment. Users should not submit passwords, payment credentials,
          government identification numbers, or other information that is not
          necessary for the learning activity.
        </p>

        <p>
          Learners should submit only the educational material necessary for
          the relevant exercise, practice set, or evaluation.
        </p>

        <p>
          If you believe information has been submitted accidentally or there
          is a privacy or security concern, please contact us promptly.
        </p>
      </>
    ),
  },

  {
    id: "changes",
    title: "13. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy as SanidhyaShala evolves, as our
          technology or services change, or as legal and regulatory
          requirements change.
        </p>

        <p>
          When we make material changes, we will update the date shown at the
          beginning of this Policy and, where appropriate, provide additional
          notice through the platform.
        </p>
      </>
    ),
  },

  {
    id: "contact",
    title: "14. Contact Us",
    content: (
      <>
        <p>
          If you have a privacy question, request, or concern regarding
          SanidhyaShala, please contact us.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-medium text-slate-900">SanidhyaShala</p>

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

export default function PrivacyPage() {
  return (
    <main className="relative isolate overflow-hidden bg-white">
      {/* Subtle background atmosphere */}
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
            Legal & Privacy
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            How SanidhyaShala collects, uses, stores, and protects information
            while providing a thoughtful learning environment.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: September 15, 2026
          </p>
        </div>

        {/* Intro notice */}
        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <p className="text-sm leading-7 text-slate-700">
            We believe privacy should be explained clearly rather than hidden
            behind complicated language. This Policy describes the information
            that SanidhyaShala may collect and process to provide, secure,
            support, and improve its learning, evaluation, communication, and
            related services.
          </p>
        </div>

        {/* Table of contents */}
        <nav
          aria-label="Privacy Policy sections"
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

        {/* Policy content */}
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

        {/* Bottom navigation */}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            ← Back to SanidhyaShala
          </Link>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/terms"
              className="text-slate-600 transition hover:text-blue-700"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/refund-policy"
              className="text-slate-600 transition hover:text-blue-700"
            >
              Refund & Cancellation
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