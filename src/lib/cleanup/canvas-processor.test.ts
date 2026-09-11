import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadImageElement,
  runCleanupOperation,
} from "@/lib/cleanup/canvas-processor";
import { CleanupProcessingError } from "@/lib/cleanup/types";

/**
 * A recording stand-in for CanvasRenderingContext2D. jsdom creates real
 * <canvas> elements but doesn't implement 2D rendering itself (that needs
 * the native `canvas` package, which this project deliberately does not
 * depend on). Recording the real sequence of calls our processor makes —
 * rather than mocking processor internals — is what lets these tests catch
 * an actual logic bug (wrong rect, missing clip, wrong filter) instead of
 * just asserting the function returns.
 */
class FakeContext2D {
  calls: Array<{ name: string; args: unknown[] }> = [];
  filter = "none";

  drawImage(...args: unknown[]) {
    this.calls.push({ name: "drawImage", args });
  }
  save() {
    this.calls.push({ name: "save", args: [] });
  }
  restore() {
    this.calls.push({ name: "restore", args: [] });
  }
  beginPath() {
    this.calls.push({ name: "beginPath", args: [] });
  }
  rect(...args: unknown[]) {
    this.calls.push({ name: "rect", args });
  }
  clip() {
    this.calls.push({ name: "clip", args: [] });
  }
}

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
      this.naturalWidth = 1000;
      this.naturalHeight = 500;
      this.onload?.();
    });
  }

  get src() {
    return this.#src;
  }
}

let lastContext: FakeContext2D | null = null;
let toBlobShouldFail = false;

function stubCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
    lastContext = new FakeContext2D();
    return lastContext as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    queueMicrotask(() => {
      callback(toBlobShouldFail ? null : new Blob(["fake-bytes"]));
    });
  });
}

describe("cleanup canvas-processor", () => {
  beforeEach(() => {
    toBlobShouldFail = false;
    lastContext = null;
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:result"),
    });
    stubCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function loadFakeSource() {
    return loadImageElement("blob:source") as unknown as HTMLImageElement;
  }

  describe("loadImageElement", () => {
    it("resolves a real decoded image element", async () => {
      const img = await loadFakeSource();
      expect(img.naturalWidth).toBe(1000);
      expect(img.naturalHeight).toBe(500);
    });

    it("rejects for an unreadable source", async () => {
      await expect(loadImageElement("blob:corrupt")).rejects.toThrow(
        CleanupProcessingError,
      );
    });
  });

  describe("runCleanupOperation — blur-region", () => {
    it("draws the full image, then clips and redraws with a real blur filter over only the selected region", async () => {
      const source = await loadFakeSource();
      const region = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

      const result = await runCleanupOperation(source, region, "blur-region", {
        blurStrength: 12,
      });

      expect(result.url).toBe("blob:result");
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);

      const ctx = lastContext!;
      const drawCalls = ctx.calls.filter((c) => c.name === "drawImage");
      expect(drawCalls).toHaveLength(2);

      // Second draw is clipped to the real pixel rect for the region...
      const clipRect = ctx.calls.find((c) => c.name === "rect")?.args;
      expect(clipRect).toEqual([100, 100, 300, 200]); // 0.1*1000, 0.2*500, 0.3*1000, 0.4*500
      expect(ctx.calls.map((c) => c.name)).toEqual([
        "drawImage",
        "save",
        "beginPath",
        "rect",
        "clip",
        "drawImage",
        "restore",
      ]);
      // ...with a genuine CSS blur filter, not a fake/simulated one.
      expect(ctx.filter).toBe("blur(12px)");
    });

    it("leaves the output the same size as the source (region is obscured, not removed)", async () => {
      const source = await loadFakeSource();
      const result = await runCleanupOperation(
        source,
        { x: 0, y: 0, width: 0.5, height: 0.5 },
        "blur-region",
      );
      expect(result.width).toBe(source.naturalWidth);
      expect(result.height).toBe(source.naturalHeight);
    });
  });

  describe("runCleanupOperation — crop-region", () => {
    it("crops down to only the selected region's real pixels", async () => {
      const source = await loadFakeSource();
      const region = { x: 0.25, y: 0.4, width: 0.5, height: 0.2 };

      const result = await runCleanupOperation(source, region, "crop-region");

      expect(result.width).toBe(500); // 0.5 * 1000
      expect(result.height).toBe(100); // 0.2 * 500

      const ctx = lastContext!;
      expect(ctx.calls).toEqual([
        {
          name: "drawImage",
          args: [source, 250, 200, 500, 100, 0, 0, 500, 100],
        },
      ]);
    });
  });

  describe("runCleanupOperation — validation and failure modes", () => {
    it("rejects an invalid (too small) region without touching the canvas", async () => {
      const source = await loadFakeSource();
      await expect(
        runCleanupOperation(
          source,
          { x: 0.1, y: 0.1, width: 0.001, height: 0.2 },
          "blur-region",
        ),
      ).rejects.toMatchObject({ kind: "invalid-region" });
      expect(lastContext).toBeNull();
    });

    it("rejects an operation that has no real implementation, rather than faking a result", async () => {
      const source = await loadFakeSource();
      await expect(
        runCleanupOperation(
          source,
          { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
          "remove-watermark",
        ),
      ).rejects.toMatchObject({ kind: "unavailable-operation" });
    });

    it("surfaces a real encode failure instead of a false success", async () => {
      toBlobShouldFail = true;
      const source = await loadFakeSource();
      await expect(
        runCleanupOperation(
          source,
          { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
          "crop-region",
        ),
      ).rejects.toMatchObject({ kind: "processing-failed" });
    });
  });
});
