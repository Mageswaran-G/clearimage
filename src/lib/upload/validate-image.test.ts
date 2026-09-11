import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processSelectedFile } from "@/lib/upload/validate-image";
import {
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/upload/constants";

/** A controllable stand-in for the browser's Image element. */
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  #src = "";

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => {
      if (value === "blob:corrupt") {
        this.onerror?.();
        return;
      }
      // "blob:dims:WIDTHxHEIGHT" lets tests control the decoded pixel size;
      // anything else (the default mock URL) decodes as an 800x600 photo.
      const match = /^blob:dims:(\d+)x(\d+)$/.exec(value);
      if (match) {
        this.naturalWidth = Number(match[1]);
        this.naturalHeight = Number(match[2]);
      } else {
        this.naturalWidth = 800;
        this.naturalHeight = 600;
      }
      this.onload?.();
    });
  }

  get src() {
    return this.#src;
  }
}

// Real magic bytes for each supported format, so files are valid by default
// unless a test deliberately overrides `bytes` to exercise signature checks.
const JPEG_HEADER = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);
const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const DEFAULT_HEADERS: Record<string, Uint8Array<ArrayBuffer>> = {
  "image/jpeg": JPEG_HEADER,
  "image/png": PNG_HEADER,
  "image/webp": WEBP_HEADER,
};

function makeFile(
  name: string,
  type: string,
  size = 1024,
  bytes?: Uint8Array<ArrayBuffer>,
): File {
  const content = bytes ?? DEFAULT_HEADERS[type] ?? new Uint8Array(1);
  const file = new File([content], name, { type });
  Object.defineProperty(file, "size", { value: size, configurable: true });
  return file;
}

describe("processSelectedFile", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts a valid JPG", async () => {
    const result = await processSelectedFile(
      makeFile("photo.jpg", "image/jpeg"),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts a valid PNG", async () => {
    const result = await processSelectedFile(
      makeFile("photo.png", "image/png"),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts a valid WebP", async () => {
    const result = await processSelectedFile(
      makeFile("photo.webp", "image/webp"),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects an unsupported MIME type", async () => {
    const result = await processSelectedFile(makeFile("anim.gif", "image/gif"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unsupported-format");
  });

  it("rejects a file larger than the 25 MB limit", async () => {
    const result = await processSelectedFile(
      makeFile("huge.jpg", "image/jpeg", MAX_UPLOAD_SIZE_BYTES + 1),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("too-large");
  });

  it("rejects a corrupt or unreadable image", async () => {
    createObjectURL.mockReturnValue("blob:corrupt");
    const result = await processSelectedFile(
      makeFile("broken.jpg", "image/jpeg"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("corrupt");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:corrupt");
  });

  it("extracts pixel dimensions from a valid image", async () => {
    const result = await processSelectedFile(
      makeFile("photo.jpg", "image/jpeg"),
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.dimensions).toEqual({ width: 800, height: 600 });
  });

  it("produces a temporary object-URL preview, not a base64 data URL", async () => {
    const file = makeFile("photo.jpg", "image/jpeg");
    const result = await processSelectedFile(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.previewUrl).toBe("blob:mock-url");
    expect(createObjectURL).toHaveBeenCalledWith(file);
  });

  describe("file signature validation", () => {
    it("accepts a file with a valid JPEG signature", async () => {
      const result = await processSelectedFile(
        makeFile("photo.jpg", "image/jpeg", 1024, JPEG_HEADER),
      );
      expect(result.ok).toBe(true);
    });

    it("accepts a file with a valid PNG signature", async () => {
      const result = await processSelectedFile(
        makeFile("photo.png", "image/png", 1024, PNG_HEADER),
      );
      expect(result.ok).toBe(true);
    });

    it("accepts a file with a valid WebP signature", async () => {
      const result = await processSelectedFile(
        makeFile("photo.webp", "image/webp", 1024, WEBP_HEADER),
      );
      expect(result.ok).toBe(true);
    });

    it("rejects a file whose real signature doesn't match its declared MIME type", async () => {
      // Browser reports PNG, but the bytes are actually a JPEG.
      const result = await processSelectedFile(
        makeFile("fake.png", "image/png", 1024, JPEG_HEADER),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("unsupported-format");
    });

    it("rejects a file with an unrecognized signature, even with a supported MIME type", async () => {
      const textBytes = new TextEncoder().encode("not an image, just text");
      const result = await processSelectedFile(
        makeFile("fake.jpg", "image/jpeg", 1024, textBytes),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("unsupported-format");
    });

    it("rejects a file with a truncated/too-short header", async () => {
      const result = await processSelectedFile(
        makeFile("tiny.jpg", "image/jpeg", 2, new Uint8Array([0xff, 0xd8])),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("corrupt");
    });
  });

  describe("dimension / pixel limit", () => {
    it("accepts a normal-size photo", async () => {
      createObjectURL.mockReturnValue("blob:dims:4000x3000");
      const result = await processSelectedFile(
        makeFile("photo.jpg", "image/jpeg"),
      );
      expect(result.ok).toBe(true);
    });

    it("rejects an image with an oversized width", async () => {
      createObjectURL.mockReturnValue(
        `blob:dims:${MAX_IMAGE_DIMENSION_PX + 1}x100`,
      );
      const result = await processSelectedFile(
        makeFile("wide.jpg", "image/jpeg"),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("dimensions-too-large");
      expect(revokeObjectURL).toHaveBeenCalled();
    });

    it("rejects an image with an oversized height", async () => {
      createObjectURL.mockReturnValue(
        `blob:dims:100x${MAX_IMAGE_DIMENSION_PX + 1}`,
      );
      const result = await processSelectedFile(
        makeFile("tall.jpg", "image/jpeg"),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("dimensions-too-large");
    });

    it("rejects an image whose total pixel count is excessive, even under the per-side limit", async () => {
      // 9000 x 9000 = 81 megapixels: each side is under the per-side cap,
      // but the total pixel count is well past MAX_IMAGE_PIXELS.
      createObjectURL.mockReturnValue("blob:dims:9000x9000");
      const result = await processSelectedFile(
        makeFile("huge-square.jpg", "image/jpeg"),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("dimensions-too-large");
    });

    it("accepts an image exactly at the pixel-count boundary", async () => {
      const width = MAX_IMAGE_DIMENSION_PX;
      const height = Math.floor(MAX_IMAGE_PIXELS / width);
      createObjectURL.mockReturnValue(`blob:dims:${width}x${height}`);
      const result = await processSelectedFile(
        makeFile("boundary.jpg", "image/jpeg"),
      );
      expect(result.ok).toBe(true);
    });
  });
});
