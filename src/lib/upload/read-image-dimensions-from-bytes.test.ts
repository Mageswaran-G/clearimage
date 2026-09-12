import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readImageDimensionsFromBytes } from "@/lib/upload/read-image-dimensions-from-bytes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PNG_PATH = path.join(
  __dirname,
  "../../../e2e/fixtures/test-image.png",
);

/** A minimal, real, valid baseline JPEG header: SOI, then an SOF0 segment
 * declaring a fixed width/height, nothing else (the parser never reads
 * past the first SOF marker, so no image data is needed). */
function buildJpegHeader(width: number, height: number): Uint8Array {
  const bytes = [
    0xff,
    0xd8, // SOI
    0xff,
    0xc0, // SOF0
    0x00,
    0x11, // segment length (17)
    0x08, // precision
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03, // number of components
    0x01,
    0x22,
    0x00,
    0x02,
    0x11,
    0x01,
    0x03,
    0x11,
    0x01,
  ];
  return new Uint8Array(bytes);
}

/** A minimal, real VP8X (extended) WebP header declaring canvas width/height. */
function buildWebpVp8xHeader(width: number, height: number): Uint8Array {
  const w = width - 1;
  const h = height - 1;
  const bytes = [
    0x52,
    0x49,
    0x46,
    0x46, // "RIFF"
    0x00,
    0x00,
    0x00,
    0x00, // file size (unused by the parser)
    0x57,
    0x45,
    0x42,
    0x50, // "WEBP"
    0x56,
    0x50,
    0x38,
    0x58, // "VP8X"
    0x0a,
    0x00,
    0x00,
    0x00, // chunk size (10)
    0x00, // flags
    0x00,
    0x00,
    0x00, // reserved
    w & 0xff,
    (w >> 8) & 0xff,
    (w >> 16) & 0xff,
    h & 0xff,
    (h >> 8) & 0xff,
    (h >> 16) & 0xff,
  ];
  return new Uint8Array(bytes);
}

/** A minimal, real VP8L (lossless) WebP header. */
function buildWebpVp8lHeader(width: number, height: number): Uint8Array {
  const w = width - 1;
  const h = height - 1;
  const bits = (w & 0x3fff) | ((h & 0x3fff) << 14);
  const bytes = [
    0x52,
    0x49,
    0x46,
    0x46,
    0x00,
    0x00,
    0x00,
    0x00,
    0x57,
    0x45,
    0x42,
    0x50,
    0x56,
    0x50,
    0x38,
    0x4c, // "VP8L"
    0x05,
    0x00,
    0x00,
    0x00, // chunk size
    0x2f, // VP8L signature byte
    bits & 0xff,
    (bits >> 8) & 0xff,
    (bits >> 16) & 0xff,
    (bits >> 24) & 0xff,
  ];
  return new Uint8Array(bytes);
}

describe("readImageDimensionsFromBytes", () => {
  it("reads real PNG dimensions from the actual test fixture (100x100)", () => {
    const bytes = new Uint8Array(readFileSync(REAL_PNG_PATH));
    expect(readImageDimensionsFromBytes(bytes, "png")).toEqual({
      width: 100,
      height: 100,
    });
  });

  it("reads JPEG dimensions from an SOF0 header", () => {
    const bytes = buildJpegHeader(640, 480);
    expect(readImageDimensionsFromBytes(bytes, "jpeg")).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("reads WebP VP8X (extended) dimensions", () => {
    const bytes = buildWebpVp8xHeader(1024, 768);
    expect(readImageDimensionsFromBytes(bytes, "webp")).toEqual({
      width: 1024,
      height: 768,
    });
  });

  it("reads WebP VP8L (lossless) dimensions", () => {
    const bytes = buildWebpVp8lHeader(256, 128);
    expect(readImageDimensionsFromBytes(bytes, "webp")).toEqual({
      width: 256,
      height: 128,
    });
  });

  it("returns null for a truncated/malformed header instead of guessing", () => {
    expect(readImageDimensionsFromBytes(new Uint8Array(4), "png")).toBeNull();
    expect(readImageDimensionsFromBytes(new Uint8Array(4), "jpeg")).toBeNull();
    expect(readImageDimensionsFromBytes(new Uint8Array(4), "webp")).toBeNull();
  });

  it("returns null when the PNG's first chunk isn't IHDR", () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x00, 0x00, 0x00, 0x00], 8); // length
    bytes.set([0x41, 0x42, 0x43, 0x44], 12); // not "IHDR"
    expect(readImageDimensionsFromBytes(bytes, "png")).toBeNull();
  });
});
