import exifr from "exifr";
import type { MetadataSummary } from "@/lib/provenance/types";

const EMPTY_SUMMARY: MetadataSummary = {
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

const ORIENTATION_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Mirrored horizontal",
  3: "Rotated 180°",
  4: "Mirrored vertical",
  5: "Mirrored horizontal, rotated 270°",
  6: "Rotated 90°",
  7: "Mirrored horizontal, rotated 90°",
  8: "Rotated 270°",
};

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatCaptureDate(value: unknown): string | null {
  const date = value instanceof Date ? value : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function describeOrientation(value: unknown): string | null {
  if (typeof value === "number" && ORIENTATION_LABELS[value]) {
    return ORIENTATION_LABELS[value];
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function describeBitDepth(tags: Record<string, unknown>): string | null {
  const raw = tags.BitDepth ?? tags.BitsPerSample;
  if (typeof raw === "number") return `${raw}-bit`;
  if (Array.isArray(raw) && raw.length > 0) return `${raw[0]}-bit`;
  return null;
}

function describeCompression(tags: Record<string, unknown>): string | null {
  const raw = tags.Compression;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number") return String(raw);
  return null;
}

function describeColorSpace(tags: Record<string, unknown>): string | null {
  if (tags.ColorSpace === 1) return "sRGB";
  const profile = cleanString(tags.ProfileDescription);
  if (profile) return profile;
  return null;
}

function detectGps(tags: Record<string, unknown>): boolean {
  return (
    typeof tags.latitude === "number" ||
    typeof tags.longitude === "number" ||
    tags.GPSLatitude !== undefined ||
    tags.GPSLongitude !== undefined
  );
}

/**
 * Reads real embedded metadata (EXIF/TIFF/ICC/PNG IHDR) from the file.
 * Never reads GPS coordinate values into the returned summary — only
 * whether GPS data is present — so the UI layer cannot expose them even
 * by mistake.
 */
export async function inspectMetadata(file: File): Promise<MetadataSummary> {
  let tags: Record<string, unknown> | undefined;

  try {
    tags = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      icc: true,
      ihdr: true,
      translateValues: true,
      reviveValues: true,
      mergeOutput: true,
    });
  } catch {
    return EMPTY_SUMMARY;
  }

  if (!tags) return EMPTY_SUMMARY;

  return {
    hasExifData: true,
    cameraMake: cleanString(tags.Make),
    cameraModel: cleanString(tags.Model),
    captureDate: formatCaptureDate(
      tags.DateTimeOriginal ?? tags.CreateDate ?? tags.ModifyDate,
    ),
    software: cleanString(tags.Software),
    orientation: describeOrientation(tags.Orientation),
    bitDepth: describeBitDepth(tags),
    compression: describeCompression(tags),
    colorSpace: describeColorSpace(tags),
    hasGpsData: detectGps(tags),
  };
}
