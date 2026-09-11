import { isValidRegion } from "@/lib/cleanup/region";
import {
  CleanupProcessingError,
  type CleanupOperationId,
  type CleanupOptions,
  type CleanupRegion,
  type CleanupResult,
} from "@/lib/cleanup/types";

export const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = { blurStrength: 16 };

// Quality used when re-encoding to a lossy format (JPEG/WebP). PNG ignores
// this — it's always lossless. Canvas.toBlob() defaults to PNG when no
// type is given at all, which would silently convert every JPEG/WebP
// upload to PNG on output; passing the source's own MIME type here keeps
// the output format matching the input instead.
const LOSSY_EXPORT_QUALITY = 0.92;

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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const quality = mimeType === "image/png" ? undefined : LOSSY_EXPORT_QUALITY;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else
          reject(
            new CleanupProcessingError(
              "processing-failed",
              "Could not encode the processed image.",
            ),
          );
      },
      mimeType,
      quality,
    );
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
  outputMimeType: string,
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

  const blob = await canvasToBlob(canvas, outputMimeType);
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
  outputMimeType: string,
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

  const blob = await canvasToBlob(canvas, outputMimeType);
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
 *
 * `sourceMimeType` (the original upload's real MIME type, from Upload's
 * signature-validated file) is passed straight through to `canvas.toBlob`,
 * so a JPEG stays a JPEG and a WebP stays a WebP — `toBlob` silently
 * defaults to PNG when given no type, which would otherwise convert every
 * non-PNG upload to PNG on output without anyone asking for that.
 */
export async function runCleanupOperation(
  source: HTMLImageElement,
  region: CleanupRegion,
  operationId: CleanupOperationId,
  sourceMimeType: string,
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
      return blurRegion(source, region, options.blurStrength, sourceMimeType);
    case "crop-region":
      return cropToRegion(source, region, sourceMimeType);
    default:
      throw new CleanupProcessingError(
        "unavailable-operation",
        "This operation is not available yet in this version of ClearImage.",
      );
  }
}
