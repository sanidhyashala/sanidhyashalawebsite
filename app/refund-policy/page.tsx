import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  HelpCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | SanidhyaShala",
  description:
    "Refund and cancellation policy for digital educational products and services offered by SanidhyaShala.",
};

const sections = [
  {
    id: "overview",
    title: "1. Overview",
  },
  {
    id: "digital-services",
    title: "2. Digital Educational Services",
  },
  {
    id: "eligible-refunds",
    title: "3. Situations Where a Refund May Be Considered",
  },
  {
    id: "non-refundable",
    title: "4. Situations Where a Refund May Not Be Available",
  },
  {
    id: "failed-payment",
    title: "5. Failed, Duplicate or Unsuccessful Payments",
  },
  {
    id: "evaluation-services",
    title: "6. Teacher Evaluation Services",
  },
  {
    id: "cancellation",
    title: "7. Cancellation",
  },
  {
    id: "processing",
    title: "8. Refund Processing",
  },
  {
    id: "how-to-request",
    title: "9. How to Request a Refund",
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
  },
  {
    id: "contact",
    title: "11. Contact",
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <svg
          className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 opacity-[0.07]"
          viewBox="0 0 900 520"
          fill="none"
        >
          <circle
            cx="450"
            cy="40"
            r="260"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="450"
            cy="40"
            r="190"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="450"
            cy="40"
            r="120"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M120 320C240 220 330 410 450 300C570 190 650 390 780 250"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
        {/* Back */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to SanidhyaShala
          </Link>
        </div>

        {/* Hero */}
        <header className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground shadow-sm backdrop-blur">
            <RefreshCcw className="h-3.5 w-3.5" />
            Policy
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Refund &amp; Cancellation Policy
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
            At SanidhyaShala, we want payment and cancellation decisions to be
            clear before a learner purchases anything. This policy explains how
            refunds are handled for our digital educational products and
            services.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Last updated: September 15, 2026</span>
            <span className="hidden sm:inline">•</span>
            <span>
              Applies to paid digital services offered by SanidhyaShala
            </span>
          </div>
        </header>

        {/* Important note */}
        <section className="mt-12 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-6 dark:border-blue-900/60 dark:bg-blue-950/20 sm:p-7">
          <div className="flex gap-4">
            <div className="mt-0.5 shrink-0">
              <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>

            <div>
              <h2 className="font-semibold">A note about paid features</h2>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                SanidhyaShala may introduce paid educational resources,
                evaluation services, or other digital services over time.
                Where a purchase is available, the applicable price,
                product/service description, and any purchase-specific
                cancellation or refund conditions will be presented before
                payment.
              </p>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                If a paid feature is not currently available for purchase,
                this policy does not represent that such a purchase is
                currently active.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                On this page
              </p>

              <nav aria-label="Refund policy sections">
                <ul className="space-y-1.5">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block rounded-lg px-2.5 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="min-w-0 max-w-3xl space-y-14">
            {/* 1 */}
            <section id="overview" className="scroll-mt-24">
              <SectionHeading
                icon={<FileCheck2 className="h-5 w-5" />}
                title="1. Overview"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  SanidhyaShala primarily provides digital educational
                  experiences. These may include learning resources,
                  assessments, subjective evaluation services, and other
                  education-related digital features.
                </p>

                <p>
                  Because digital services can become available immediately
                  after purchase or may involve work performed specifically
                  for a learner, refunds are considered according to the
                  nature and status of the particular purchase.
                </p>

                <p>
                  Nothing in this policy is intended to remove or restrict any
                  right that cannot legally be excluded or limited under
                  applicable law.
                </p>
              </div>
            </section>

            {/* 2 */}
            <section id="digital-services" className="scroll-mt-24">
              <SectionHeading
                icon={<CreditCard className="h-5 w-5" />}
                title="2. Digital Educational Services"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  SanidhyaShala does not currently operate as a physical-goods
                  store. Our paid offerings, when available, are expected to
                  consist primarily of digital educational products and
                  services.
                </p>

                <p>
                  Depending on the product, access may be granted to digital
                  content, assessments, premium learning features, or a
                  teacher-assisted evaluation service.
                </p>

                <p>
                  The nature of the purchased product or service will be shown
                  before payment so that the learner or purchaser can
                  understand what is being purchased.
                </p>
              </div>
            </section>

            {/* 3 */}
            <section id="eligible-refunds" className="scroll-mt-24">
              <SectionHeading
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="3. Situations Where a Refund May Be Considered"
              />

              <p className="mt-5 text-[15px] leading-8 text-muted-foreground">
                A refund or other appropriate resolution may be considered,
                after verification, in situations such as:
              </p>

              <BulletList
                items={[
                  "A payment was successfully charged but the purchased access or service was not made available because of a SanidhyaShala-side technical or processing failure.",
                  "The same transaction was charged more than once due to a duplicate payment.",
                  "A payment was completed but the corresponding purchase was not correctly recorded or fulfilled.",
                  "A transaction is found to have been processed incorrectly and a refund is appropriate after reviewing the payment details.",
                  "A specific product or checkout page expressly provides a refund or cancellation right for that purchase.",
                ]}
              />

              <p className="mt-5 text-[15px] leading-8 text-muted-foreground">
                Where a problem can be resolved by restoring access or
                correcting the purchase record, SanidhyaShala may choose that
                remedy instead of a monetary refund where appropriate.
              </p>
            </section>

            {/* 4 */}
            <section id="non-refundable" className="scroll-mt-24">
              <SectionHeading
                icon={<ShieldCheck className="h-5 w-5" />}
                title="4. Situations Where a Refund May Not Be Available"
              />

              <p className="mt-5 text-[15px] leading-8 text-muted-foreground">
                A refund is not automatically guaranteed merely because a
                learner changes their mind after receiving or using a digital
                service.
              </p>

              <p className="mt-5 text-[15px] leading-8 text-muted-foreground">
                Depending on the product and the applicable purchase terms,
                refunds may not be available where:
              </p>

              <BulletList
                items={[
                  "Digital access has already been provided and the purchased content or service has been substantially used.",
                  "A learner has submitted work for a service that has already been performed or substantially performed.",
                  "The issue results from misuse of the platform, sharing of account credentials, or violation of the Terms of Service.",
                  "The request falls outside any product-specific refund or cancellation terms shown at the time of purchase.",
                ]}
              />

              <p className="mt-5 text-[15px] leading-8 text-muted-foreground">
                These examples do not override rights that may apply under
                applicable law.
              </p>
            </section>

            {/* 5 */}
            <section id="failed-payment" className="scroll-mt-24">
              <SectionHeading
                icon={<CreditCard className="h-5 w-5" />}
                title="5. Failed, Duplicate or Unsuccessful Payments"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  Sometimes a payment can appear successful at the bank or
                  payment provider even though the purchase is not immediately
                  reflected on SanidhyaShala.
                </p>

                <p>
                  If money has been debited but the purchased access has not
                  been provided, please contact us with the relevant payment
                  information. We will first verify the transaction and
                  purchase status.
                </p>

                <p>
                  For duplicate charges, we will verify the transactions and
                  process an appropriate correction or refund where the
                  duplicate payment is confirmed.
                </p>

                <p>
                  Payment status shown by the payment provider and the
                  transaction records available to SanidhyaShala may be used
                  to verify the status of a payment.
                </p>
              </div>
            </section>

            {/* 6 */}
            <section id="evaluation-services" className="scroll-mt-24">
              <SectionHeading
                icon={<FileCheck2 className="h-5 w-5" />}
                title="6. Teacher Evaluation Services"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  Some SanidhyaShala services may involve a learner submitting
                  written mathematical work for teacher review and evaluation.
                </p>

                <p>
                  If such a service has not yet been started or performed, a
                  cancellation or refund may be considered depending on the
                  applicable purchase terms.
                </p>

                <p>
                  Once a teacher evaluation has been completed or substantially
                  performed, a refund will generally not be automatic merely
                  because the learner disagrees with the evaluation or expected
                  a different result.
                </p>

                <p>
                  If there is a genuine service failure, such as a submission
                  being lost because of a SanidhyaShala-side technical issue,
                  please contact us so that the issue can be reviewed and an
                  appropriate resolution can be determined.
                </p>
              </div>
            </section>

            {/* 7 */}
            <section id="cancellation" className="scroll-mt-24">
              <SectionHeading
                icon={<RefreshCcw className="h-5 w-5" />}
                title="7. Cancellation"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  Cancellation availability depends on the type of digital
                  product or service purchased.
                </p>

                <p>
                  Where cancellation is possible, the applicable cancellation
                  terms will be presented with the relevant product or service.
                  A request made after digital access has been delivered or
                  after a service has begun may not be eligible for
                  cancellation.
                </p>

                <p>
                  If a recurring or subscription-based service is introduced
                  in the future, its cancellation rules will be displayed
                  separately before purchase.
                </p>
              </div>
            </section>

            {/* 8 */}
            <section id="processing" className="scroll-mt-24">
              <SectionHeading
                icon={<RefreshCcw className="h-5 w-5" />}
                title="8. Refund Processing"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  When a refund is approved, it will normally be initiated
                  through the payment method or payment provider used for the
                  original transaction, where technically and operationally
                  possible.
                </p>

                <p>
                  The time taken for the refunded amount to appear in the
                  original account can depend on the payment provider, bank,
                  card network, or other financial institution involved.
                </p>

                <p>
                  SanidhyaShala cannot guarantee the exact date on which a
                  bank or payment provider will credit a refunded amount after
                  the refund has been initiated.
                </p>

                <p>
                  We may ask for reasonable transaction information to verify a
                  refund request. Please do not send passwords, authentication
                  codes, or other sensitive account credentials by email.
                </p>
              </div>
            </section>

            {/* 9 */}
            <section id="how-to-request" className="scroll-mt-24">
              <SectionHeading
                icon={<HelpCircle className="h-5 w-5" />}
                title="9. How to Request a Refund"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  To request a refund or report a payment problem, contact us
                  at{" "}
                  <a
                    href="mailto:sanidhyashala.official@gmail.com"
                    className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                  >
                    sanidhyashala.official@gmail.com
                  </a>
                  .
                </p>

                <p>
                  Please include enough information for us to identify the
                  transaction, such as:
                </p>

                <BulletList
                  items={[
                    "The email address associated with your SanidhyaShala account.",
                    "The date and approximate time of the payment.",
                    "The purchased product or service.",
                    "The transaction or payment reference, if available.",
                    "A brief explanation of the issue or reason for the request.",
                  ]}
                />

                <p>
                  For security reasons, never include your password, OTP,
                  payment PIN, CVV, or other authentication credentials in a
                  refund request.
                </p>

                <div className="mt-7 rounded-2xl border border-border bg-muted/40 p-5 sm:p-6">
                  <p className="text-sm font-medium text-foreground">
                    Need help with something that is not a refund?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    For account, learning, technical, or general support,
                    please use our contact page.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Contact SanidhyaShala
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            {/* 10 */}
            <section id="changes" className="scroll-mt-24">
              <SectionHeading
                icon={<FileCheck2 className="h-5 w-5" />}
                title="10. Changes to This Policy"
              />

              <div className="mt-5 space-y-5 text-[15px] leading-8 text-muted-foreground">
                <p>
                  We may update this Refund &amp; Cancellation Policy when our
                  products, payment arrangements, or legal and operational
                  requirements change.
                </p>

                <p>
                  The updated version will be published on this page with a
                  revised “Last updated” date.
                </p>

                <p>
                  For a particular purchase, the terms shown to the purchaser
                  at the time of checkout may also contain product-specific
                  conditions.
                </p>
              </div>
            </section>

            {/* 11 */}
            <section id="contact" className="scroll-mt-24">
              <SectionHeading
                icon={<HelpCircle className="h-5 w-5" />}
                title="11. Contact"
              />

              <div className="mt-5 rounded-2xl border border-border bg-background/70 p-6 shadow-sm sm:p-7">
                <p className="text-[15px] leading-8 text-muted-foreground">
                  If you have a question about a payment, cancellation, refund,
                  or any part of this policy, please contact us.
                </p>

                <div className="mt-5">
                  <p className="text-sm font-medium text-foreground">
                    SanidhyaShala
                  </p>

                  <a
                    href="mailto:sanidhyashala.official@gmail.com"
                    className="mt-1 inline-block text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    sanidhyashala.official@gmail.com
                  </a>
                </div>
              </div>
            </section>

            {/* Bottom navigation */}
            <div className="border-t border-border pt-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/privacy"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Terms of Service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
        {icon}
      </span>
      <span>{title}</span>
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3 pl-1">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-[15px] leading-7 text-muted-foreground"
        >
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}