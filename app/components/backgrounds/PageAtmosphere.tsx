"use client";

type PageAtmosphereProps = {
  type:
    | "home"
    | "learning"
    | "teaching"
    | "reflection"
    | "journal"
    | "about"
    | "contact";
};

type AtmosphereTheme =
  | "learning"
  | "teaching"
  | "reflection"
  | "journal"
  | "about"
  | "contact";

export default function PageAtmosphere({
  type,
}: PageAtmosphereProps) {
  if (type === "learning") {
    return <AtmosphereField theme="learning" />;
  }

  if (type === "teaching") {
    return <AtmosphereField theme="teaching" />;
  }

  if (type === "reflection") {
    return <AtmosphereField theme="reflection" />;
  }

  if (type === "journal") {
    return <AtmosphereField theme="journal" />;
  }

  if (type === "about") {
    return <AtmosphereField theme="about" />;
  }

  if (type === "contact") {
    return <AtmosphereField theme="contact" />;
  }

  return null;
}

/* =========================================================
   SANIDHYASHALA PAGE ATMOSPHERE
   Unified Motion System
   ========================================================= */

function AtmosphereField({
  theme,
}: {
  theme: AtmosphereTheme;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <style>{`
        /* =====================================================
           ONE MOTION LANGUAGE FOR ALL PAGES
           ===================================================== */

        @keyframes atmosphere-flow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -180;
          }
        }

        @keyframes atmosphere-drift {
          0%,
          100% {
            transform: translate3d(-10px, 4px, 0);
          }

          50% {
            transform: translate3d(10px, -6px, 0);
          }
        }

        @keyframes atmosphere-breathe {
          0%,
          100% {
            opacity: 0.10;
            transform: scale(1);
          }

          50% {
            opacity: 0.20;
            transform: scale(1.04);
          }
        }

        @keyframes atmosphere-node {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(1);
          }

          50% {
            opacity: 0.68;
            transform: scale(1.35);
          }
        }

        @keyframes atmosphere-orbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* -----------------------------------------------------
           IMPORTANT:
           Every moving line uses exactly the same 18s timing.
           ----------------------------------------------------- */

        .atmosphere-flow {
          animation:
            atmosphere-flow
            18s
            linear
            infinite;
        }

        .atmosphere-drift {
          animation:
            atmosphere-drift
            48s
            ease-in-out
            infinite;
        }

        .atmosphere-breathe {
          animation:
            atmosphere-breathe
            20s
            ease-in-out
            infinite;
        }

        .atmosphere-node {
          transform-box: fill-box;
          transform-origin: center;
          animation:
            atmosphere-node
            9s
            ease-in-out
            infinite;
        }

        .atmosphere-node-slow {
          transform-box: fill-box;
          transform-origin: center;
          animation:
            atmosphere-node
            12s
            ease-in-out
            infinite;
        }

        .atmosphere-orbit {
          transform-box: fill-box;
          transform-origin: center;
          animation:
            atmosphere-orbit
            120s
            linear
            infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .atmosphere-flow,
          .atmosphere-drift,
          .atmosphere-breathe,
          .atmosphere-node,
          .atmosphere-node-slow,
          .atmosphere-orbit {
            animation: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          SOFT AMBIENT LIGHT
          ===================================================== */}

      <AmbientGlow theme={theme} />

      {/* =====================================================
          FULL PAGE MOVING FIELD
          ===================================================== */}

      <div className="atmosphere-drift absolute inset-0 min-w-[1100px]">
        <svg
          viewBox="0 0 1400 2400"
          fill="none"
          preserveAspectRatio="none"
          className="
            absolute
            left-1/2
            top-0
            h-full
            w-full
            -translate-x-1/2
          "
        >
          {/* =================================================
              BASE STRUCTURAL LINES
              ================================================= */}

          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="
              text-blue-900/[0.075]
              dark:text-blue-300/[0.065]
            "
          >
            <path d="M-120 180 C220 60 470 330 760 190 S1200 120 1520 300" />

            <path d="M-120 500 C220 360 480 630 790 470 S1200 390 1520 550" />

            <path d="M-120 820 C220 680 480 950 800 790 S1200 690 1520 860" />

            <path d="M-120 1140 C220 990 500 1270 820 1110 S1210 1010 1520 1180" />

            <path d="M-120 1460 C220 1310 480 1580 810 1420 S1210 1320 1520 1500" />

            <path d="M-120 1780 C220 1630 500 1900 830 1740 S1210 1640 1520 1820" />

            <path d="M-120 2100 C220 1950 500 2220 820 2060 S1210 1960 1520 2140" />
          </g>

          {/* =================================================
              PRIMARY MOVING LINES
              
              ALL OF THESE:
              - same dash pattern
              - same 18s speed
              - same direction
              
              This creates one visual language across pages.
              ================================================= */}

          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray="6 18"
            strokeWidth="1.4"
            className="
              text-blue-900/[0.14]
              dark:text-blue-300/[0.11]
            "
          >
            <path
              d="M-180 300 C120 120 410 470 700 300 S1120 120 1580 360"
              className="atmosphere-flow"
            />

            <path
              d="M-180 620 C120 440 410 790 700 620 S1120 440 1580 680"
              className="atmosphere-flow"
            />

            <path
              d="M-180 940 C120 760 420 1110 700 940 S1120 760 1580 1000"
              className="atmosphere-flow"
            />

            <path
              d="M-180 1260 C120 1080 420 1430 700 1260 S1120 1080 1580 1320"
              className="atmosphere-flow"
            />

            <path
              d="M-180 1580 C120 1400 420 1750 700 1580 S1120 1400 1580 1640"
              className="atmosphere-flow"
            />

            <path
              d="M-180 1900 C120 1720 420 2070 700 1900 S1120 1720 1580 1960"
              className="atmosphere-flow"
            />

            <path
              d="M-180 2220 C120 2040 420 2390 700 2220 S1120 2040 1580 2280"
              className="atmosphere-flow"
            />
          </g>

          {/* =================================================
              SECONDARY MOVING LINES
              Slightly thinner, same speed.
              ================================================= */}

          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray="3 22"
            strokeWidth="0.9"
            className="
              text-blue-900/[0.085]
              dark:text-blue-300/[0.07]
            "
          >
            <path
              d="M-100 410 C230 260 450 500 720 390 S1120 250 1500 450"
              className="atmosphere-flow"
            />

            <path
              d="M-100 730 C230 580 450 820 720 710 S1120 570 1500 770"
              className="atmosphere-flow"
            />

            <path
              d="M-100 1050 C230 900 450 1140 720 1030 S1120 890 1500 1090"
              className="atmosphere-flow"
            />

            <path
              d="M-100 1370 C230 1220 450 1460 720 1350 S1120 1210 1500 1410"
              className="atmosphere-flow"
            />

            <path
              d="M-100 1690 C230 1540 450 1780 720 1670 S1120 1530 1500 1730"
              className="atmosphere-flow"
            />

            <path
              d="M-100 2010 C230 1860 450 2100 720 1990 S1120 1850 1500 2050"
              className="atmosphere-flow"
            />
          </g>

          {/* =================================================
              LONG VERTICAL CURRENTS
              ================================================= */}

          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            className="
              text-slate-700/[0.065]
              dark:text-slate-300/[0.05]
            "
          >
            <path d="M150 -100 C420 280 40 650 310 1050 S470 1760 180 2500" />

            <path d="M1250 -100 C980 280 1360 650 1090 1050 S930 1760 1220 2500" />
          </g>

          {/* =================================================
              PAGE-SPECIFIC GEOMETRY
              ================================================= */}

          {theme === "learning" && (
            <LearningGeometry />
          )}

          {theme === "teaching" && (
            <TeachingGeometry />
          )}

          {theme === "reflection" && (
            <ReflectionGeometry />
          )}

          {theme === "journal" && (
            <JournalGeometry />
          )}

          {theme === "about" && (
            <AboutGeometry />
          )}

          {theme === "contact" && (
            <ContactGeometry />
          )}
        </svg>
      </div>
    </div>
  );
}

/* =========================================================
   AMBIENT GLOW
   ========================================================= */

function AmbientGlow({
  theme,
}: {
  theme: AtmosphereTheme;
}) {
  const glow =
    theme === "reflection"
      ? "bg-indigo-200/10 dark:bg-indigo-500/[0.035]"
      : theme === "journal"
        ? "bg-blue-200/10 dark:bg-blue-500/[0.035]"
        : theme === "contact"
          ? "bg-blue-200/10 dark:bg-blue-500/[0.035]"
          : "bg-blue-200/10 dark:bg-blue-500/[0.035]";

  return (
    <>
      <div
        className={`atmosphere-breathe absolute -left-48 top-[8%] h-[30rem] w-[30rem] rounded-full blur-3xl ${glow}`}
      />

      <div
        className={`atmosphere-breathe absolute -right-48 top-[38%] h-[34rem] w-[34rem] rounded-full blur-3xl ${glow}`}
        style={{
          animationDelay: "-7s",
        }}
      />

      <div
        className={`atmosphere-breathe absolute left-[30%] bottom-[-12rem] h-[32rem] w-[32rem] rounded-full blur-3xl ${glow}`}
        style={{
          animationDelay: "-13s",
        }}
      />
    </>
  );
}

/* =========================================================
   LEARNING
   Knowledge Network
   ========================================================= */

function LearningGeometry() {
  return (
    <>
      {/* Network connections */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.10]
          dark:text-blue-300/[0.075]
        "
      >
        <path d="M140 280L420 180L700 330L980 190L1260 350" />

        <path d="M140 280L340 600L700 330L900 620L1260 350" />

        <path d="M100 920L350 780L620 980L900 820L1190 980L1320 820" />

        <path d="M350 780L430 1180L900 820L960 1190L1190 980" />

        <path d="M140 1600L390 1480L680 1680L930 1500L1210 1680" />

        <path d="M390 1480L500 1840L680 1680L840 1920L930 1500" />
      </g>

      {/* Network nodes */}

      <g fill="currentColor">
        <circle
          cx="140"
          cy="280"
          r="5"
          className="atmosphere-node"
        />

        <circle
          cx="420"
          cy="180"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="700"
          cy="330"
          r="7"
          className="atmosphere-node"
        />

        <circle
          cx="980"
          cy="190"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1260"
          cy="350"
          r="5"
          className="atmosphere-node"
        />

        <circle
          cx="340"
          cy="600"
          r="5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="900"
          cy="620"
          r="6"
          className="atmosphere-node"
        />

        <circle
          cx="350"
          cy="780"
          r="5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="620"
          cy="980"
          r="4"
          className="atmosphere-node"
        />

        <circle
          cx="900"
          cy="820"
          r="6"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1190"
          cy="980"
          r="5"
          className="atmosphere-node"
        />

        <circle
          cx="680"
          cy="1680"
          r="7"
          className="atmosphere-node"
        />

        <circle
          cx="930"
          cy="1500"
          r="5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="840"
          cy="1920"
          r="6"
          className="atmosphere-node"
        />
      </g>
    </>
  );
}

/* =========================================================
   TEACHING
   Flow of Knowledge
   ========================================================= */

function TeachingGeometry() {
  return (
    <>
      {/* Teacher → learner flowing paths */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.095]
          dark:text-blue-300/[0.075]
        "
      >
        <path d="M40 40C220 190 250 370 120 560C40 680 60 820 220 930" />

        <path d="M1360 40C1180 190 1150 370 1280 560C1360 680 1340 820 1180 930" />

        <path d="M80 700C260 850 280 1080 120 1270C50 1370 70 1510 230 1630" />

        <path d="M1320 700C1140 850 1120 1080 1280 1270C1350 1370 1330 1510 1170 1630" />
      </g>

      {/* Moving knowledge paths */}

      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="6 18"
        strokeWidth="1.2"
        className="
          text-blue-900/[0.11]
          dark:text-blue-300/[0.085]
        "
      >
        <path
          d="M-120 360C180 180 420 520 700 350S1120 180 1520 420"
          className="atmosphere-flow"
        />

        <path
          d="M-120 1000C180 820 420 1160 700 990S1120 820 1520 1060"
          className="atmosphere-flow"
        />

        <path
          d="M-120 1640C180 1460 420 1800 700 1630S1120 1460 1520 1700"
          className="atmosphere-flow"
        />
      </g>

      {/* Knowledge orbits */}

      <g
        className="
          atmosphere-orbit
          text-blue-900/[0.06]
          dark:text-blue-300/[0.045]
        "
      >
        <ellipse
          cx="700"
          cy="500"
          rx="360"
          ry="150"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 20"
        />

        <ellipse
          cx="700"
          cy="1200"
          rx="430"
          ry="180"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 22"
        />

        <ellipse
          cx="700"
          cy="1900"
          rx="360"
          ry="150"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 20"
        />
      </g>

      {/* Teaching nodes */}

      <g fill="currentColor">
        <circle
          cx="180"
          cy="300"
          r="4"
          className="atmosphere-node"
        />

        <circle
          cx="700"
          cy="420"
          r="7"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1220"
          cy="300"
          r="4"
          className="atmosphere-node"
        />

        <circle
          cx="260"
          cy="900"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="700"
          cy="1100"
          r="7"
          className="atmosphere-node"
        />

        <circle
          cx="1140"
          cy="900"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="200"
          cy="1540"
          r="4"
          className="atmosphere-node"
        />

        <circle
          cx="700"
          cy="1740"
          r="7"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1200"
          cy="1540"
          r="4"
          className="atmosphere-node"
        />
      </g>
    </>
  );
}

/* =========================================================
   REFLECTION
   Quiet Currents
   ========================================================= */

function ReflectionGeometry() {
  return (
    <>
      {/* Quiet inner currents */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.085]
          dark:text-blue-300/[0.065]
        "
      >
        <path d="M0 100C180 260 190 450 70 620C0 720 20 850 150 980" />

        <path d="M1400 100C1220 260 1210 450 1330 620C1400 720 1380 850 1250 980" />

        <path d="M0 1220C190 1380 200 1580 70 1750C0 1850 20 1990 150 2110" />

        <path d="M1400 1220C1210 1380 1200 1580 1330 1750C1400 1850 1380 1990 1250 2110" />
      </g>

      {/* Reflection rings */}

      <g
        className="
          atmosphere-orbit
          text-blue-900/[0.065]
          dark:text-blue-300/[0.05]
        "
      >
        <ellipse
          cx="700"
          cy="520"
          rx="350"
          ry="155"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 20"
        />

        <ellipse
          cx="700"
          cy="1200"
          rx="450"
          ry="190"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 22"
        />

        <ellipse
          cx="700"
          cy="1880"
          rx="350"
          ry="155"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 20"
        />
      </g>

      {/* Reflection points */}

      <g fill="currentColor">
        <circle
          cx="180"
          cy="340"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="500"
          cy="500"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="920"
          cy="430"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1210"
          cy="650"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="260"
          cy="1040"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="700"
          cy="1160"
          r="4"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1120"
          cy="1060"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="320"
          cy="1530"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="860"
          cy="1720"
          r="4"
          className="atmosphere-node"
        />

        <circle
          cx="1190"
          cy="1580"
          r="3"
          className="atmosphere-node-slow"
        />
      </g>
    </>
  );
}

/* =========================================================
   JOURNAL
   Ideas Moving Through Time
   ========================================================= */

function JournalGeometry() {
  return (
    <>
      {/* Long conceptual curves */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.075]
          dark:text-blue-300/[0.055]
        "
      >
        <path d="M180 -100C420 300 20 600 300 1000S480 1700 210 2500" />

        <path d="M1180 -100C920 300 1360 600 1110 1000S930 1700 1210 2500" />
      </g>

      {/* Idea orbits */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.065]
          dark:text-blue-300/[0.05]
        "
      >
        <ellipse
          cx="300"
          cy="560"
          rx="180"
          ry="95"
        />

        <ellipse
          cx="1100"
          cy="920"
          rx="210"
          ry="110"
        />

        <ellipse
          cx="380"
          cy="1510"
          rx="220"
          ry="120"
        />

        <ellipse
          cx="1050"
          cy="1880"
          rx="190"
          ry="100"
        />
      </g>

      {/* One large slow conceptual orbit */}

      <g
        className="
          atmosphere-orbit
          text-blue-900/[0.035]
          dark:text-blue-300/[0.03]
        "
      >
        <ellipse
          cx="700"
          cy="1200"
          rx="560"
          ry="980"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>

      {/* Thought nodes */}

      <g fill="currentColor">
        <circle
          cx="180"
          cy="300"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="510"
          cy="470"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="910"
          cy="380"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="1240"
          cy="650"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="300"
          cy="900"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="760"
          cy="1050"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1120"
          cy="1280"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="430"
          cy="1580"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="860"
          cy="1760"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="1210"
          cy="1940"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="240"
          cy="2150"
          r="2.5"
          className="atmosphere-node"
        />
      </g>
    </>
  );
}

/* =========================================================
   ABOUT
   Nearness / Presence
   ========================================================= */

function AboutGeometry() {
  return (
    <>
      {/* Large concentric fields */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.075]
          dark:text-blue-300/[0.055]
        "
      >
        <ellipse
          cx="700"
          cy="620"
          rx="420"
          ry="230"
        />

        <ellipse
          cx="700"
          cy="620"
          rx="310"
          ry="165"
        />

        <ellipse
          cx="700"
          cy="620"
          rx="205"
          ry="105"
        />

        <ellipse
          cx="700"
          cy="1660"
          rx="470"
          ry="250"
        />

        <ellipse
          cx="700"
          cy="1660"
          rx="350"
          ry="185"
        />

        <ellipse
          cx="700"
          cy="1660"
          rx="225"
          ry="115"
        />
      </g>

      {/* Large slow orbit */}

      <g
        className="
          atmosphere-orbit
          text-blue-900/[0.035]
          dark:text-blue-300/[0.025]
        "
      >
        <ellipse
          cx="700"
          cy="1200"
          rx="560"
          ry="1000"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>

      {/* Presence points */}

      <g fill="currentColor">
        <circle
          cx="245"
          cy="410"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="525"
          cy="610"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="910"
          cy="500"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="1160"
          cy="760"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="300"
          cy="1040"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="760"
          cy="1180"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1090"
          cy="1390"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="430"
          cy="1610"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="870"
          cy="1760"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="1190"
          cy="1980"
          r="3"
          className="atmosphere-node-slow"
        />
      </g>
    </>
  );
}

/* =========================================================
   CONTACT
   Connection / Communication
   ========================================================= */

function ContactGeometry() {
  return (
    <>
      {/* Communication arcs */}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="
          text-blue-900/[0.075]
          dark:text-blue-300/[0.055]
        "
      >
        <ellipse
          cx="700"
          cy="600"
          rx="420"
          ry="210"
        />

        <ellipse
          cx="700"
          cy="600"
          rx="300"
          ry="145"
        />

        <ellipse
          cx="700"
          cy="600"
          rx="190"
          ry="90"
        />
      </g>

      {/* Long communication orbit */}

      <g
        className="
          atmosphere-orbit
          text-blue-900/[0.035]
          dark:text-blue-300/[0.025]
        "
      >
        <ellipse
          cx="700"
          cy="1050"
          rx="540"
          ry="760"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>

      {/* Connection points */}

      <g fill="currentColor">
        <circle
          cx="220"
          cy="300"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="520"
          cy="470"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="910"
          cy="380"
          r="3"
          className="atmosphere-node"
        />

        <circle
          cx="1180"
          cy="620"
          r="2.5"
          className="atmosphere-node-slow"
        />

        <circle
          cx="320"
          cy="850"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="760"
          cy="1040"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="1080"
          cy="1210"
          r="2.5"
          className="atmosphere-node"
        />

        <circle
          cx="430"
          cy="1390"
          r="3"
          className="atmosphere-node-slow"
        />

        <circle
          cx="900"
          cy="1510"
          r="2.5"
          className="atmosphere-node"
        />
      </g>
    </>
  );
}