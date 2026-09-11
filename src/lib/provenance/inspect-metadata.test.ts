import { describe, expect, it, vi } from "vitest";
import exifr from "exifr";
import { inspectMetadata } from "@/lib/provenance/inspect-metadata";

vi.mock("exifr", () => ({
  default: { parse: vi.fn() },
}));

function makeFile(name: string, type: string): File {
  return new File([new Uint8Array(4)], name, { type });
}

describe("inspectMetadata", () => {
  it("extracts camera, software, orientation, and color space for a JPEG with full EXIF", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({
      Make: "Canon",
      Model: "EOS R5",
      DateTimeOriginal: new Date("2024-03-04T10:00:00Z"),
      Software: "Adobe Photoshop 25.0",
      Orientation: 1,
      ColorSpace: 1,
    });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.hasExifData).toBe(true);
    expect(result.cameraMake).toBe("Canon");
    expect(result.cameraModel).toBe("EOS R5");
    expect(result.software).toBe("Adobe Photoshop 25.0");
    expect(result.orientation).toBe("Normal");
    expect(result.colorSpace).toBe("sRGB");
    expect(result.captureDate).toBeTruthy();
  });

  it("handles a PNG with only structural metadata and no camera info", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ BitDepth: 8 });

    const result = await inspectMetadata(makeFile("graphic.png", "image/png"));

    expect(result.hasExifData).toBe(true);
    expect(result.bitDepth).toBe("8-bit");
    expect(result.cameraMake).toBeNull();
    expect(result.software).toBeNull();
  });

  it("handles a WebP with no embedded metadata found", async () => {
    vi.mocked(exifr.parse).mockResolvedValue(undefined);

    const result = await inspectMetadata(makeFile("image.webp", "image/webp"));

    expect(result.hasExifData).toBe(false);
  });

  it("reports metadata absent when exifr finds nothing", async () => {
    vi.mocked(exifr.parse).mockResolvedValue(undefined);

    const result = await inspectMetadata(makeFile("plain.jpg", "image/jpeg"));

    expect(result.hasExifData).toBe(false);
    expect(result.cameraMake).toBeNull();
    expect(result.software).toBeNull();
  });

  it("reports metadata present when exifr finds tags", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ Make: "Sony" });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.hasExifData).toBe(true);
  });

  it("reports the software/application field when present", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ Software: "GIMP 2.10" });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.software).toBe("GIMP 2.10");
  });

  it("reports software/application as null (not a guess) when absent", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ Make: "Canon" });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.software).toBeNull();
  });

  it("detects GPS presence as a boolean only, never exposing coordinate values", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({
      latitude: 51.5074,
      longitude: -0.1278,
    });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.hasGpsData).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/51\.5074|-0\.1278/);
  });

  it("reports no GPS data when none is present", async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ Make: "Canon" });

    const result = await inspectMetadata(makeFile("photo.jpg", "image/jpeg"));

    expect(result.hasGpsData).toBe(false);
  });

  it("gracefully returns an empty summary for an unparseable/corrupt file", async () => {
    vi.mocked(exifr.parse).mockRejectedValue(new Error("corrupt"));

    const result = await inspectMetadata(makeFile("broken.jpg", "image/jpeg"));

    expect(result.hasExifData).toBe(false);
    expect(result.cameraMake).toBeNull();
  });
});
