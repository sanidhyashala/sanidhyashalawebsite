"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";

import AuthButtons from "./ui/AuthButtons";
import SearchBar from "./search/SearchBar";

import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Navigation routes configuration
  const navLinks = useMemo(
    () => [
      { name: "Home", href: "/" },
      { name: "About", href: "/about" },
      { name: "Learning", href: "/learning" },
      { name: "Teaching", href: "/teaching" },
      { name: "Reflection", href: "/reflection" },
      { name: "Journal", href: "/journal" },
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

  // Close overlays on Escape key press
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, searchOpen]);

  // Memoized layout control handlers to prevent unnecessary re-renders
  const toggleSearch = useCallback(() => {
    setSearchOpen((prev) => !prev);
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
    setSearchOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, []);

  if (isAdmin) {
  return null;
}

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm dark:shadow-slate-900/10 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          
          {/* Brand Logo & Name */}
          <Link 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            onClick={closeAll}
          >
            <Image
              src="/logo.png"
              alt="SanidhyaShala Logo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
            />
            <span className="text-lg sm:text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100 select-none">
              सानिध्यशाला
            </span>
          </Link>

          {/* Desktop Layout Navigation Ecosystem */}
          <div className="hidden items-center gap-5 lg:gap-6 lg:flex">
            <div className="flex items-center gap-1 lg:gap-2 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeAll}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
                      isActive 
                        ? "text-blue-600 bg-blue-50/60 font-semibold border-b-2 border-blue-600 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-400" 
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="w-60 lg:w-64">
              <SearchBar />
            </div>

            <AuthButtons />
          </div>

          {/* Responsive Mobile Layout Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            
            {/* Search Dropdown Button Trigger */}
            <button
              type="button"
              aria-expanded={searchOpen}
              aria-controls="mobile-search-dropdown"
              aria-label="Toggle search panel"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 touch-manipulation ${
                searchOpen 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
              onClick={toggleSearch}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Menu Dropdown Button Trigger */}
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label="Toggle navigation menu"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 touch-manipulation ${
                menuOpen 
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
              onClick={toggleMenu}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Smooth Translucent Mobile Search Dropdown Container */}
        <div
          id="mobile-search-dropdown"
          role="search"
          className={`absolute top-full left-0 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-md dark:shadow-slate-900/50 lg:hidden z-50 origin-top transition-all duration-300 ease-out transform ${
            searchOpen 
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
        >
          <div className="w-full max-w-xl mx-auto">
            <SearchBar />
          </div>
        </div>

        {/* Smooth Translucent Mobile Navigation Menu Container */}
        <div
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute top-full left-0 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl dark:shadow-slate-900/50 lg:hidden z-50 origin-top transition-all duration-300 ease-out transform ${
            menuOpen 
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-1.5 px-4 sm:px-6 py-4 max-h-[80vh] overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeAll}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-12 items-center px-4 rounded-xl text-base font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
                    isActive 
                      ? "bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
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

      {/* Global Interactive Animated Backdrop Overlay */}
      <div 
        onClick={closeAll}
        className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          menuOpen || searchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />
    </>
  );
}