import type { HTMLAttributes } from "react";

type TechnicalLabelProps = HTMLAttributes<HTMLSpanElement>;

/** A small mono-font caption used for technical/EXIF-style data. */
export function TechnicalLabel({
  className = "",
  children,
  ...props
}: TechnicalLabelProps) {
  return (
    <span
      className={`font-mono text-xs tracking-wide text-text-secondary uppercase ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
