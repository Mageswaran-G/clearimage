import type { ImageDimensions, InspectionResult } from "@/lib/inspect/types";

/**
 * This module is a placeholder "inspection service": today it re-derives
 * results client-side from a File already held in the browser's temporary
 * upload store. It's kept independent from `@/lib/upload` on purpose (a
 * small amount of duplicated decode logic) so that swapping this for a real
 * `fetch('/api/inspect/:id')` call later doesn't require touching Upload or
 * the Analysis UI — only this file's internals change.
 */

function decodeDimensions(objectUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = objectUrl;
  });
}

function formatFromMimeType(mimeType: string): string {
  const subtype = mimeType.split("/")[1];
  return subtype ? subtype.toUpperCase() : "UNKNOWN";
}

/** Runs basic technical inspection on an already-selected file: format, size, dimensions, and decode integrity. */
export async function inspectImage(
  file: File,
  previewUrl: string,
): Promise<InspectionResult> {
  const format = formatFromMimeType(file.type);

  try {
    const dimensions = await decodeDimensions(previewUrl);
    return {
      status: "valid",
      format,
      mimeType: file.type,
      fileSizeBytes: file.size,
      fileName: file.name,
      dimensions,
      integrityPassed: true,
    };
  } catch {
    return {
      status: "invalid",
      format,
      mimeType: file.type,
      fileSizeBytes: file.size,
      fileName: file.name,
      dimensions: null,
      integrityPassed: false,
    };
  }
}
