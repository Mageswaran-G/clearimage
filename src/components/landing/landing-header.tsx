"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "@/components/landing/mobile-menu";

const NAV_LINKS = [
  { label: "Tools", href: "/upload" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
  { label: "About", href: "#about" },
];

/** The Landing page header: sticky/blurred with full nav on desktop, compact with a functional menu button on mobile. */
export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-[18px] py-4 md:px-8 md:py-5">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-graphite"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/upload"
          className="hidden rounded-md bg-graphite px-5 py-[11px] text-sm font-bold whitespace-nowrap text-background md:inline-flex md:items-center md:justify-center"
        >
          Upload Image
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-1 p-1.5 md:hidden"
        >
          <span className="h-[1.5px] w-5 bg-graphite" />
          <span className="h-[1.5px] w-5 bg-graphite" />
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
