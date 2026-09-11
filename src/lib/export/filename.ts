const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

/** The real extension for a MIME type our own processor can produce.
 * Falls back to .png — the same default `canvas.toBlob` itself falls back
 * to for any type it doesn't recognize. */
export function extensionForMimeType(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? ".png";
}

// Path separators (forward and back slash) plus filesystem/URL-hostile
// control characters. Deliberately narrow: this only strips what could
// expose a path or break a filename, not ordinary punctuation or Unicode.
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;

function sanitizeBaseName(originalName: string): string {
  // Keep only the last path segment — a full path is never a filename.
  const segments = originalName.split(/[/\\]+/);
  const lastSegment = segments[segments.length - 1] || "";
  // Drop the original extension (the last dot-segment only, so internal
  // dots in the name are preserved) so we never produce a double
  // extension like "photo.png-cleaned.png".
  const withoutExtension = lastSegment.replace(/\.[^./\\]+$/, "");
  const cleaned = withoutExtension
    .replace(UNSAFE_FILENAME_CHARS, "")
    // Strip leading/trailing dot runs left over from a name that was
    // mostly or entirely dots (e.g. "..."), rather than emit one.
    .replace(/^\.+|\.+$/g, "")
    .trim();
  return cleaned || "image";
}

/**
 * Builds a safe, deterministic export filename from the original upload
 * name and the real output MIME type — e.g. "my-photo.png" ->
 * "my-photo-cleaned.png". Never exposes a path, never doubles an
 * extension, and always uses the real output format's extension rather
 * than trusting (or copying) the original name's extension.
 */
export function buildExportFilename(
  originalName: string,
  outputMimeType: string,
): string {
  const base = sanitizeBaseName(originalName);
  const extension = extensionForMimeType(outputMimeType);
  return `${base}-cleaned${extension}`;
}
