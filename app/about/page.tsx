import AboutContent from "@/app/components/about/AboutContent";
import PageAtmosphere from "@/app/components/backgrounds/PageAtmosphere";

export default function AboutPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <PageAtmosphere type="about" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">
        <AboutContent />
      </div>
    </main>
  );
}