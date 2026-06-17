import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Sanidhyashala Logo"
          width={50}
          height={50}
          priority
        />

        <span className="text-xl font-bold text-blue-900">
          सानिध्यशाला
        </span>
      </Link>

      <div className="flex gap-6 text-sm font-medium">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/learning">Learning</Link>
        <Link href="/teaching">Teaching</Link>
        <Link href="/reflection">Reflection</Link>
        <Link href="/journal">Journal</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  );
}