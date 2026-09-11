import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

interface PrimaryButtonOwnProps {
  href?: string;
}

type PrimaryButtonProps = PrimaryButtonOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement> &
      AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

const baseClasses =
  "inline-flex items-center justify-center rounded-md bg-teal px-[26px] py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-teal-deep disabled:pointer-events-none disabled:opacity-50";

/** The main teal call-to-action. Pass `href` to render as a link, otherwise a button. */
export function PrimaryButton({
  href,
  className = "",
  children,
  ...props
}: PrimaryButtonProps) {
  const classes = `${baseClasses} ${className}`;

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
