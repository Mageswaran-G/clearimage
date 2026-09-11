import type { CleanupRegion } from "@/lib/cleanup/types";

/** A region smaller than this fraction of the image, on either axis, is
 * too small to be a deliberate selection (mis-clicks, sub-pixel drags). */
export const MIN_REGION_FRACTION = 0.02;

const EPSILON = 1e-6;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** True for a well-formed region: finite, non-negative, inside the image
 * bounds, and large enough to be a real selection rather than a stray click. */
export function isValidRegion(region: CleanupRegion): boolean {
  const { x, y, width, height } = region;
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    x >= 0 &&
    y >= 0 &&
    width >= MIN_REGION_FRACTION &&
    height >= MIN_REGION_FRACTION &&
    x + width <= 1 + EPSILON &&
    y + height <= 1 + EPSILON
  );
}

/** Builds a normalized region from two drag points (any order), clamped to
 * the 0..1 image bounds. */
export function regionFromPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): CleanupRegion {
  const x0 = clamp01(startX);
  const y0 = clamp01(startY);
  const x1 = clamp01(endX);
  const y1 = clamp01(endY);
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}
