"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AuthButtons from "./ui/AuthButtons";
import ThemeToggle from "./ThemeToggle";
import JournalNavPreview from "./ui/JournalNavPreview";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Navigation routes configuration
  const navLinks = useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "Learning", href: "/learning" },
      { name: "Teaching", href: "/teaching" },
      { name: "Reflection", href: "/reflection" },
      { name: "Journal", href: "/journal" },
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    []
  );

  // Handle body scroll locking when mobile navigation overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close mobile navigation on Escape key press
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Toggle mobile navigation
  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  // Close navigation
  const closeAll = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Admin routes use their own layout/navigation
  if (isAdmin) {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">

          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900 sm:gap-3"
            onClick={closeAll}
          >
            <Image
              src="/logo.png"
              alt="SanidhyaShala Logo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />

            <span className="select-none text-lg font-bold tracking-wide text-slate-900 dark:text-slate-100 sm:text-xl">
              सान्निध्यशाला
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-1 text-sm font-medium lg:gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                // Journal gets the special hover preview
                if (link.name === "Journal") {
                  return (
                    <JournalNavPreview
                      key={link.href}
                      href={link.href}
                      isActive={isActive}
                      onNavigate={closeAll}
                    />
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeAll}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-lg border-b-2 px-3 py-2 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
                      isActive
                        ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-blue-400"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth */}
            <div className="ml-4">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label="Toggle navigation menu"
              className={`flex h-11 w-11 items-center justify-center rounded-xl outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
                menuOpen
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
              onClick={toggleMenu}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute left-0 top-full z-50 w-full origin-top border-b border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-xl transition-all duration-300 ease-out dark:border-slate-800/60 dark:bg-slate-900/95 dark:shadow-slate-900/50 lg:hidden ${
            menuOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-95 opacity-0"
          }`}
        >
          <div className="flex max-h-[80vh] flex-col gap-1.5 overflow-y-auto px-4 py-4 sm:px-6">

            {/* Mobile Navigation Links */}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeAll}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-12 items-center rounded-xl px-4 text-base font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
                    isActive
                      ? "border-l-4 border-blue-600 bg-blue-50 font-bold text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Additional Actions */}
            <div className="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="mb-4 px-2">
                <ThemeToggle />
              </div>

              <div className="px-2 pb-2">
                <AuthButtons />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Backdrop */}
      <div
        onClick={closeAll}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 dark:bg-black/40 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
    </>
  );
}