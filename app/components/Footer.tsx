export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h3 className="text-xl font-semibold tracking-tight text-blue-900">
          सानिध्यशाला
        </h3>

        <p className="mx-auto mt-4 max-w-[32rem] text-slate-600 leading-relaxed">
          Learning deeply. Teaching thoughtfully. Reflecting honestly.
        </p>

        <p className="mt-4 text-slate-500">
          <a
            href="mailto:sanidhyashala.official@gmail.com"
            className="font-medium underline-offset-4 transition-colors duration-200 hover:underline hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md"
          >
            sanidhyashala.official@gmail.com
          </a>
        </p>

        <p className="mt-5 text-xs font-light text-slate-400">
          © {new Date().getFullYear()} Sanidhyashala. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}