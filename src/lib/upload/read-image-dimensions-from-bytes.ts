import type { ImageDimensions } from "@/lib/upload/validate-image";
import type { ImageSignature } from "@/lib/upload/image-signature";

/**
 * Reads pixel width/height directly from a JPEG/PNG/WebP header, without
 * decoding the image. Exists specifically for server-side validation:
 * Node has no `Image`/`createImageBitmap` the way a browser does, and
 * adding an image-decoding dependency (sharp, jimp, …) for this one check
 * would be a heavier and less predictable dependency than parsing the
 * three well-documented, stable header formats directly — the same
 * approach this project already takes for signature detection (see
 * image-signature.ts). Returns null for anything it can't confidently
 * parse; callers must treat that as "reject", never as "assume valid".
 */
export function readImageDimensionsFromBytes(
  bytes: Uint8Array,
  signature: ImageSignature,
): ImageDimensions | null {
  switch (signature) {
    case "png":
      return readPngDimensions(bytes);
    case "jpeg":
      return readJpegDimensions(bytes);
    case "webp":
      return readWebpDimensions(bytes);
  }
}

/** PNG: 8-byte signature, then the IHDR chunk (4-byte length + "IHDR" +
 * width/height as 4-byte big-endian integers) is always first. */
function readPngDimensions(bytes: Uint8Array): ImageDimensions | null {
  const IHDR_OFFSET = 8 + 4; // signature + this chunk's 4-byte length field
  if (bytes.length < IHDR_OFFSET + 4 + 8) return null;

  const isIhdr =
    bytes[IHDR_OFFSET] === 0x49 &&
    bytes[IHDR_OFFSET + 1] === 0x48 &&
    bytes[IHDR_OFFSET + 2] === 0x44 &&
    bytes[IHDR_OFFSET + 3] === 0x52;
  if (!isIhdr) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dataStart = IHDR_OFFSET + 4;
  const width = view.getUint32(dataStart, false);
  const height = view.getUint32(dataStart + 4, false);
  return isPlausible(width, height) ? { width, height } : null;
}

// JPEG markers that carry a frame's width/height (all "start of frame"
// variants except DHT 0xC4, JPG 0xC8, and DAC 0xCC, which reuse that byte
// range for unrelated segment types).
const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
// Standalone markers with no length field / segment payload to skip.
const JPEG_STANDALONE = new Set([0xd8, 0xd9, 0x01]);

/** JPEG: walk the marker segments (skipping each by its declared length)
 * until a start-of-frame marker gives the real pixel dimensions. */
function readJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2; // past the fixed 0xFFD8 SOI marker

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      // Fill bytes between markers are legal — advance past them.
      offset += 1;
      continue;
    }
    if (JPEG_STANDALONE.has(marker) || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const segmentLength = view.getUint16(offset + 2, false);
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      return null;
    }

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) return null;
      const height = view.getUint16(offset + 5, false);
      const width = view.getUint16(offset + 7, false);
      return isPlausible(width, height) ? { width, height } : null;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

/** WebP: dispatch on the FourCC right after the "WEBP" tag (VP8X for
 * extended files, VP8L for lossless, VP8 for classic lossy). */
function readWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 16) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fourCc = String.fromCharCode(
    bytes[12],
    bytes[13],
    bytes[14],
    bytes[15],
  );

  if (fourCc === "VP8X") {
    // 1 byte flags + 3 bytes reserved, then 3-byte little-endian (size - 1)
    // for canvas width, then canvas height.
    if (bytes.length < 30) return null;
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return isPlausible(width, height) ? { width, height } : null;
  }

  if (fourCc === "VP8L") {
    // 1-byte signature (0x2f), then a 4-byte little-endian bitstream: 14
    // bits (width - 1), 14 bits (height - 1).
    if (bytes.length < 25 || bytes[20] !== 0x2f) return null;
    const bits = view.getUint32(21, true);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return isPlausible(width, height) ? { width, height } : null;
  }

  if (fourCc === "VP8 ") {
    // 3-byte frame tag, then a fixed 3-byte start code (0x9d 0x01 0x2a),
    // then width/height as 2-byte little-endian values (low 14 bits).
    if (
      bytes.length < 30 ||
      bytes[23] !== 0x9d ||
      bytes[24] !== 0x01 ||
      bytes[25] !== 0x2a
    ) {
      return null;
    }
    const width = view.getUint16(26, true) & 0x3fff;
    const height = view.getUint16(28, true) & 0x3fff;
    return isPlausible(width, height) ? { width, height } : null;
  }

  return null;
}

function isPlausible(width: number, height: number): boolean {
  return (
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
  );
}
