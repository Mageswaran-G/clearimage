import Image from "next/image";
import type { ReactNode } from "react";

interface ImageFrameProps {
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
  /** "square" (default, matches the Cleanup placeholder) or "4/3" (Inspect/Analysis). */
  aspectRatio?: "square" | "4/3";
  /** "light" (default) for a bordered light frame, "dark" for the workspace panel used once a real image is shown. */
  tone?: "light" | "dark";
}

const aspectClass = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
};

const toneClass = {
  light: "border border-border bg-background",
  dark: "bg-workspace-dark",
};

/**
 * Structural frame for displaying an image (original, cleaned, or
 * before/after). Every `src` we render today is a browser-only object URL
 * (`blob:...`) produced by the temporary upload store, which the Next.js
 * image optimizer cannot fetch server-side — so it's always rendered
 * `unoptimized` here rather than only when a real remote source exists.
 */
export function ImageFrame({
  src,
  alt = "",
  children,
  className = "",
  aspectRatio = "square",
  tone = "light",
}: ImageFrameProps) {
  return (
    <div
      className={`flex w-full items-center justify-center overflow-hidden rounded-lg ${aspectClass[aspectRatio]} ${toneClass[tone]} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={512}
          height={512}
          unoptimized
          className="h-full w-full object-contain"
        />
      ) : (
        (children ?? (
          <span className="font-mono text-xs text-text-secondary">
            No image
          </span>
        ))
      )}
    </div>
  );
}
