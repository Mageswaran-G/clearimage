import type { SupportedMimeType } from "@/lib/upload/constants";

export type ImageSignature = "jpeg" | "png" | "webp";

// The longest header any supported format needs to identify itself
// (WebP's "RIFF" + 4-byte size + "WEBP" at offset 8).
export const SIGNATURE_HEADER_BYTES = 12;

export const SIGNATURE_MIME_TYPE: Record<ImageSignature, SupportedMimeType> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function matchesAt(
  bytes: Uint8Array,
  offset: number,
  expected: number[],
): boolean {
  if (bytes.length < offset + expected.length) return false;
  return expected.every((byte, i) => bytes[offset + i] === byte);
}

/**
 * Identifies a file's real format from its magic bytes — never from a
 * browser-reported MIME type or file extension, since both are just
 * labels the caller chose and can be wrong or spoofed. Returns null when
 * the header doesn't match any supported format, or is too short to tell.
 */
export function detectImageSignature(bytes: Uint8Array): ImageSignature | null {
  if (matchesAt(bytes, 0, [0xff, 0xd8, 0xff])) return "jpeg";

  if (matchesAt(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "png";

  if (
    matchesAt(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchesAt(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  )
    return "webp";

  return null;
}
