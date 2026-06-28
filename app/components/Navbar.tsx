"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import AuthButtons from "./ui/AuthButtons";

import SearchBar from "./search/SearchBar";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white shadow-sm">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}

        <Link href="/" className="flex items-center gap-3">

          <Image
            src="/logo.png"
            alt="SanidhyaShala Logo"
            width={50}
            height={50}
            priority
          />

          <span className="text-xl font-bold text-blue-900">
            सानिध्यशाला
          </span>

        </Link>

        {/* Desktop Menu */}

        <div className="hidden items-center gap-6 md:flex">

          <div className="flex gap-6 text-sm font-medium">

            <Link href="/">Home</Link>

            <Link href="/about">About</Link>

            <Link href="/learning">Learning</Link>

            <Link href="/teaching">Teaching</Link>

            <Link href="/reflection">Reflection</Link>

            <Link href="/journal">Journal</Link>

            <Link href="/contact">Contact</Link>

          </div>

          <div className="w-72">
  <SearchBar />
</div>

          <AuthButtons />

        </div>

        {/* Mobile Menu Button */}

        <button
          className="text-3xl md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

      </div>

      {/* Mobile Menu */}

      {menuOpen && (

        <div className="border-t bg-white md:hidden">

          <div className="flex flex-col gap-3 px-6 py-4">

            <SearchBar />

            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>

            <Link href="/about" onClick={() => setMenuOpen(false)}>
              About
            </Link>

            <Link href="/learning" onClick={() => setMenuOpen(false)}>
              Learning
            </Link>

            <Link href="/teaching" onClick={() => setMenuOpen(false)}>
              Teaching
            </Link>

            <Link href="/reflection" onClick={() => setMenuOpen(false)}>
              Reflection
            </Link>

            <Link href="/journal" onClick={() => setMenuOpen(false)}>
              Journal
            </Link>

            <Link href="/contact" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>

            <div className="pt-4">
              <AuthButtons />
            </div>

          </div>

        </div>

      )}

    </nav>
  );
}