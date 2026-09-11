"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const NAV_ITEMS = [
  { label: "Tools", href: "/upload" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
  { label: "About", href: "#about" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Accessible slide-down drawer for the mobile landing header's menu button. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Restore focus to whatever opened the menu (the header's "Open menu"
    // button) once it closes, rather than leaving focus stranded.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      // Keep keyboard focus inside the open dialog — otherwise Tab would
      // walk out into the page content hidden behind the backdrop.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-graphite/40"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="relative border-b border-border bg-background px-[18px] pt-4 pb-6 shadow-lg"
      >
        <div className="flex items-center justify-between pb-4">
          <span className="font-mono text-xs tracking-wide text-text-secondary uppercase">
            Menu
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="p-1 text-graphite"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M2 2l14 14M16 2L2 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav aria-label="Primary" className="flex flex-col">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              ref={index === 0 ? firstLinkRef : undefined}
              onClick={onClose}
              className="border-b border-border py-3 text-base font-semibold text-graphite last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
