import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

interface SecondaryButtonOwnProps {
  /** "light" for light-page contexts (default), "dark" for outline buttons on dark panels. */
  tone?: "light" | "dark";
  href?: string;
}

type SecondaryButtonProps = SecondaryButtonOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement> &
      AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

const toneClasses = {
  light:
    "border-border bg-background text-graphite hover:border-teal hover:text-teal",
  dark: "border-[#33343B] bg-transparent text-[#C7C8CC] hover:border-teal hover:text-teal",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

/** The outline secondary action. Pass `href` to render as a link, otherwise a button. */
export function SecondaryButton({
  tone = "light",
  href,
  className = "",
  children,
  ...props
}: SecondaryButtonProps) {
  const classes = `${baseClasses} ${toneClasses[tone]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
