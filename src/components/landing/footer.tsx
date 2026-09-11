import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/**
 * Canonical footer navigation (approved G.3). The link set is the same at
 * every breakpoint — only the layout changes.
 */
const GROUPS = [
  {
    label: "Product",
    links: [
      { label: "Upload", href: "/upload" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Provenance", href: "/upload" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Privacy", href: "#privacy" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-[18px] py-8 md:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 md:flex-row md:justify-between md:gap-16">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-mono text-xs text-text-secondary">
            © 2026 ClearImage
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-16">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-3 font-mono text-[11px] tracking-wide text-text-secondary uppercase">
                {group.label}
              </div>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-semibold text-text-secondary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
