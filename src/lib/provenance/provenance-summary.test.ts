import { describe, expect, it } from "vitest";
import { buildMetadataRows } from "@/lib/provenance/provenance-summary";
import type { MetadataSummary } from "@/lib/provenance/types";

const baseMetadata: MetadataSummary = {
  hasExifData: false,
  cameraMake: null,
  cameraModel: null,
  captureDate: null,
  software: null,
  orientation: null,
  bitDepth: null,
  compression: null,
  colorSpace: null,
  hasGpsData: false,
};

describe("buildMetadataRows", () => {
  it("always includes Creating application, falling back to Not detected", () => {
    const rows = buildMetadataRows(baseMetadata);
    expect(rows.find((r) => r.label === "Creating application")?.value).toBe(
      "Not detected",
    );
  });

  it("shows the real software value when present", () => {
    const rows = buildMetadataRows({
      ...baseMetadata,
      software: "Adobe Lightroom",
    });
    expect(rows.find((r) => r.label === "Creating application")?.value).toBe(
      "Adobe Lightroom",
    );
  });

  it("omits camera/date/orientation rows entirely when not available", () => {
    const rows = buildMetadataRows(baseMetadata);
    expect(rows.find((r) => r.label === "Camera")).toBeUndefined();
    expect(rows.find((r) => r.label === "Capture date")).toBeUndefined();
    expect(rows.find((r) => r.label === "Orientation")).toBeUndefined();
  });

  it("shows GPS metadata only as a presence indicator, never coordinates", () => {
    const rows = buildMetadataRows({ ...baseMetadata, hasGpsData: true });
    const gpsRow = rows.find((r) => r.label === "GPS metadata");
    expect(gpsRow?.value).toBe("Present");
    expect(JSON.stringify(rows)).not.toMatch(/\d{1,3}\.\d+/);
  });

  it("omits the GPS row entirely when no GPS data exists", () => {
    const rows = buildMetadataRows(baseMetadata);
    expect(rows.find((r) => r.label === "GPS metadata")).toBeUndefined();
  });

  it("combines camera make and model into one row", () => {
    const rows = buildMetadataRows({
      ...baseMetadata,
      cameraMake: "Canon",
      cameraModel: "EOS R5",
    });
    expect(rows.find((r) => r.label === "Camera")?.value).toBe("Canon EOS R5");
  });
});
