import { describe, expect, it } from "vitest";
import {
  detectImageSignature,
  SIGNATURE_HEADER_BYTES,
} from "@/lib/upload/image-signature";

describe("detectImageSignature", () => {
  it("identifies a valid JPEG signature", () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    expect(detectImageSignature(bytes)).toBe("jpeg");
  });

  it("identifies a valid PNG signature", () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(detectImageSignature(bytes)).toBe("png");
  });

  it("identifies a valid WebP signature (RIFF....WEBP)", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectImageSignature(bytes)).toBe("webp");
  });

  it("returns null for an unsupported/unrecognized signature", () => {
    const bytes = new TextEncoder().encode("not an image, just text");
    expect(detectImageSignature(bytes)).toBeNull();
  });

  it("returns null for a RIFF file that isn't WebP (wrong sub-format tag)", () => {
    const bytes = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46,
      0x24,
      0x00,
      0x00,
      0x00,
      0x41,
      0x56,
      0x49,
      0x20, // "AVI "
    ]);
    expect(detectImageSignature(bytes)).toBeNull();
  });

  it("returns null for a truncated/too-short header", () => {
    const bytes = new Uint8Array([0xff, 0xd8]);
    expect(detectImageSignature(bytes)).toBeNull();
  });

  it("returns null for an empty buffer", () => {
    expect(detectImageSignature(new Uint8Array(0))).toBeNull();
  });

  it("exposes the byte count needed to identify any supported format", () => {
    expect(SIGNATURE_HEADER_BYTES).toBeGreaterThanOrEqual(12);
  });
});
