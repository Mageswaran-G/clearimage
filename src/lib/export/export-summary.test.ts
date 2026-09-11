import { describe, expect, it } from "vitest";
import { buildExportSummary } from "@/lib/export/export-summary";
import type { CleanupResultRecord } from "@/lib/cleanup/cleanup-result-store";

function makeResult(
  overrides: Partial<CleanupResultRecord> = {},
): CleanupResultRecord {
  return {
    blob: new Blob(["fake-bytes"], { type: "image/png" }),
    url: "blob:result",
    width: 800,
    height: 600,
    operationId: "blur-region",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("buildExportSummary", () => {
  it("describes the processed result, not the original", () => {
    const result = makeResult({ width: 400, height: 300 });
    const summary = buildExportSummary("original-name.jpg", result);

    expect(summary.resolution).toBe("400 × 300");
    expect(summary.previewUrl).toBe("blob:result");
    expect(summary.downloadUrl).toBe("blob:result");
  });

  it("reports the real output format from the result's own blob type", () => {
    const pngResult = makeResult({
      blob: new Blob(["x"], { type: "image/png" }),
    });
    expect(buildExportSummary("photo.jpg", pngResult).format).toBe("PNG");

    const jpegResult = makeResult({
      blob: new Blob(["x"], { type: "image/jpeg" }),
    });
    expect(buildExportSummary("photo.png", jpegResult).format).toBe("JPEG");
  });

  it("reports the real byte size of the processed blob", () => {
    const bytes = new Uint8Array(21);
    const result = makeResult({
      blob: new Blob([bytes], { type: "image/png" }),
    });
    const summary = buildExportSummary("photo.png", result);
    expect(summary.fileSizeBytes).toBe(21);
    expect(summary.fileSizeLabel).toBe("21 B");
  });

  it("builds the download filename from the original name and the real output format", () => {
    const result = makeResult({
      blob: new Blob(["x"], { type: "image/jpeg" }),
    });
    const summary = buildExportSummary("my-photo.png", result);
    expect(summary.downloadFilename).toBe("my-photo-cleaned.jpg");
  });
});
