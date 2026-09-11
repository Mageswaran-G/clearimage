import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { processSelectedFile } from "@/lib/upload/validate-image";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/upload/constants";

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
      } else {
        this.naturalWidth = 800;
        this.naturalHeight = 600;
        this.onload?.();
      }
    });
  }

  get src() {
    return this.#src;
  }
}

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File([new Uint8Array(1)], name, { type });
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
});
