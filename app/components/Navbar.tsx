"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
const [menuOpen, setMenuOpen] = useState(false);

return ( <nav className="border-b bg-white shadow-sm"> <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
{/* Logo */} <Link href="/" className="flex items-center gap-3"> <Image
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

    {/* Desktop Menu */}
    <div className="hidden md:flex gap-6 text-sm font-medium">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/learning">Learning</Link>
      <Link href="/teaching">Teaching</Link>
      <Link href="/reflection">Reflection</Link>
      <Link href="/journal">Journal</Link>
      <Link href="/contact">Contact</Link>
    </div>

    {/* Mobile Menu Button */}
    <button
      className="text-3xl md:hidden"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      ☰
    </button>
  </div>

  {/* Mobile Dropdown */}
  {menuOpen && (

  <div className="border-t bg-white md:hidden">
    <div className="flex flex-col px-6 py-4 text-sm font-medium">
      <Link
        href="/"
        className="py-2"
        onClick={() => setMenuOpen(false)}
      >
        Home
      </Link>

```
  <Link
    href="/about"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    About
  </Link>

  <Link
    href="/learning"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    Learning
  </Link>

  <Link
    href="/teaching"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    Teaching
  </Link>

  <Link
    href="/reflection"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    Reflection
  </Link>

  <Link
    href="/journal"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    Journal
  </Link>

  <Link
    href="/contact"
    className="py-2"
    onClick={() => setMenuOpen(false)}
  >
    Contact
  </Link>
</div>
```

  </div>
)}

</nav>


);
}
