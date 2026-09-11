import Link from "next/link";

interface LogoProps {
  className?: string;
  /** "dark" text on light backgrounds (default), "light" text for dark backgrounds. */
  tone?: "dark" | "light";
}

/** The ClearImage brand mark: four corner brackets with a teal accent dot, plus the wordmark. */
export function Logo({ className = "", tone = "dark" }: LogoProps) {
  const strokeColor = tone === "dark" ? "#0B1114" : "#FFFFFF";
  const textColor = tone === "dark" ? "text-graphite" : "text-white";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-display text-lg font-extrabold tracking-tight ${textColor} ${className}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 32 32"
        className="flex-none"
        aria-hidden="true"
      >
        <path
          d="M4 12V6a2 2 0 0 1 2-2h6"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M28 12V6a2 2 0 0 0-2-2h-6"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M4 20v6a2 2 0 0 0 2 2h6"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M28 20v6a2 2 0 0 1-2 2h-6"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="19" cy="13" r="3" fill="#00A6A6" />
      </svg>
      <span>ClearImage</span>
    </Link>
  );
}
