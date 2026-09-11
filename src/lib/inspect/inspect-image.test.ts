import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspectImage } from "@/lib/inspect/inspect-image";

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
      } else {
        this.naturalWidth = 1920;
        this.naturalHeight = 1080;
        this.onload?.();
      }
    });
  }

  get src() {
    return this.#src;
  }
}

function makeFile(name: string, type: string, size = 2048): File {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size, configurable: true });
  return file;
}

describe("inspectImage", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports JPEG format for a valid JPEG file", async () => {
    const result = await inspectImage(
      makeFile("photo.jpg", "image/jpeg"),
      "blob:ok",
    );
    expect(result.status).toBe("valid");
    expect(result.format).toBe("JPEG");
  });

  it("reports PNG format for a valid PNG file", async () => {
    const result = await inspectImage(
      makeFile("photo.png", "image/png"),
      "blob:ok",
    );
    expect(result.status).toBe("valid");
    expect(result.format).toBe("PNG");
  });

  it("reports WEBP format for a valid WebP file", async () => {
    const result = await inspectImage(
      makeFile("photo.webp", "image/webp"),
      "blob:ok",
    );
    expect(result.status).toBe("valid");
    expect(result.format).toBe("WEBP");
  });

  it("reads pixel dimensions from the decoded image", async () => {
    const result = await inspectImage(
      makeFile("photo.jpg", "image/jpeg"),
      "blob:ok",
    );
    expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
  });

  it("reports the file's byte size", async () => {
    const result = await inspectImage(
      makeFile("photo.jpg", "image/jpeg", 3_145_728),
      "blob:ok",
    );
    expect(result.fileSizeBytes).toBe(3_145_728);
  });

  it("marks an undecodable (invalid/corrupt) image as invalid with no dimensions", async () => {
    const result = await inspectImage(
      makeFile("broken.jpg", "image/jpeg"),
      "blob:corrupt",
    );
    expect(result.status).toBe("invalid");
    expect(result.integrityPassed).toBe(false);
    expect(result.dimensions).toBeNull();
  });

  it("still reports a format label for a file with an unsupported/unknown MIME type", async () => {
    const result = await inspectImage(
      makeFile("mystery.bin", "application/octet-stream"),
      "blob:ok",
    );
    expect(result.format).toBe("OCTET-STREAM");
  });
});
