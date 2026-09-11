import { isValidRegion } from "@/lib/cleanup/region";
import {
  CleanupProcessingError,
  type CleanupOperationId,
  type CleanupOptions,
  type CleanupRegion,
  type CleanupResult,
} from "@/lib/cleanup/types";

export const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = { blurStrength: 16 };

/** Loads a URL (an object URL from the temp store, in practice) into a
 * real, decoded `<img>` element so Canvas can draw from it. */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new CleanupProcessingError(
          "processing-failed",
          "The source image could not be read.",
        ),
      );
    img.src = url;
  });
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new CleanupProcessingError(
      "processing-failed",
      "Canvas 2D is not supported in this browser.",
    );
  }
  return ctx;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else
        reject(
          new CleanupProcessingError(
            "processing-failed",
            "Could not encode the processed image.",
          ),
        );
    });
  });
}

/** Region fraction -> real pixel rect against the source's natural size. */
function toPixelRect(
  region: CleanupRegion,
  sourceWidth: number,
  sourceHeight: number,
) {
  return {
    x: Math.round(region.x * sourceWidth),
    y: Math.round(region.y * sourceHeight),
    width: Math.max(1, Math.round(region.width * sourceWidth)),
    height: Math.max(1, Math.round(region.height * sourceHeight)),
  };
}

/**
 * Blurs only the selected region, leaving the rest of the image pixel-for-
 * pixel untouched and the canvas the same size as the source. Real Canvas
 * 2D work: draw the source once, then clip to the region and redraw the
 * source again with a genuine `filter: blur(...)` — nothing is simulated.
 */
async function blurRegion(
  source: HTMLImageElement,
  region: CleanupRegion,
  blurStrength: number,
): Promise<CleanupResult> {
  const width = source.naturalWidth;
  const height = source.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = get2dContext(canvas);

  ctx.drawImage(source, 0, 0, width, height);

  const rect = toPixelRect(region, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.filter = `blur(${blurStrength}px)`;
  ctx.drawImage(source, 0, 0, width, height);
  ctx.restore();

  const blob = await canvasToBlob(canvas);
  return { blob, url: URL.createObjectURL(blob), width, height };
}

/**
 * Crops the image down to only the selected region, discarding everything
 * outside it. A real, ordinary crop — the output is smaller and contains
 * only real source pixels, nothing generated or guessed.
 */
async function cropToRegion(
  source: HTMLImageElement,
  region: CleanupRegion,
): Promise<CleanupResult> {
  const sourceWidth = source.naturalWidth;
  const sourceHeight = source.naturalHeight;
  const rect = toPixelRect(region, sourceWidth, sourceHeight);

  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = get2dContext(canvas);
  ctx.drawImage(
    source,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );

  const blob = await canvasToBlob(canvas);
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: rect.width,
    height: rect.height,
  };
}

/**
 * The real, current Cleanup processing engine. This is the seam: a future
 * server-side or ML-based processor can replace this function's body (same
 * signature, same CleanupResult shape) without the UI changing at all.
 * Any operation id besides the two real ones throws rather than faking a
 * result — there is no path here that returns success without a genuine
 * Canvas operation having run.
 */
export async function runCleanupOperation(
  source: HTMLImageElement,
  region: CleanupRegion,
  operationId: CleanupOperationId,
  options: CleanupOptions = DEFAULT_CLEANUP_OPTIONS,
): Promise<CleanupResult> {
  if (!isValidRegion(region)) {
    throw new CleanupProcessingError(
      "invalid-region",
      "The selected area is too small or invalid. Try selecting a larger area.",
    );
  }

  if (!source.naturalWidth || !source.naturalHeight) {
    throw new CleanupProcessingError(
      "processing-failed",
      "The source image has no readable dimensions.",
    );
  }

  switch (operationId) {
    case "blur-region":
      return blurRegion(source, region, options.blurStrength);
    case "crop-region":
      return cropToRegion(source, region);
    default:
      throw new CleanupProcessingError(
        "unavailable-operation",
        "This operation is not available yet in this version of ClearImage.",
      );
  }
}
