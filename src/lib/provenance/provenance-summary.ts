import { inspectImage } from "@/lib/inspect/inspect-image";
import { formatFileSize } from "@/lib/format-file-size";
import { inspectMetadata } from "@/lib/provenance/inspect-metadata";
import { inspectC2pa } from "@/lib/provenance/inspect-c2pa";
import type {
  EditingSignal,
  MetadataSummary,
  ProvenanceSummary,
} from "@/lib/provenance/types";

export interface MetadataRowData {
  label: string;
  value: string;
}

/**
 * Turns the real metadata we found into the approved row list. Rows only
 * appear when we genuinely have the value — except "Creating application",
 * which is always shown (falling back to "Not detected") per the approved
 * requirement — and GPS, which only ever appears as a presence indicator.
 */
export function buildMetadataRows(
  metadata: MetadataSummary,
): MetadataRowData[] {
  const rows: MetadataRowData[] = [];

  if (metadata.bitDepth)
    rows.push({ label: "Bit depth", value: metadata.bitDepth });
  if (metadata.compression)
    rows.push({ label: "Compression", value: metadata.compression });

  rows.push({
    label: "Creating application",
    value: metadata.software ?? "Not detected",
  });

  const camera = [metadata.cameraMake, metadata.cameraModel]
    .filter(Boolean)
    .join(" ");
  if (camera) rows.push({ label: "Camera", value: camera });

  if (metadata.captureDate)
    rows.push({ label: "Capture date", value: metadata.captureDate });
  if (metadata.orientation)
    rows.push({ label: "Orientation", value: metadata.orientation });
  if (metadata.hasGpsData)
    rows.push({ label: "GPS metadata", value: "Present" });

  return rows;
}

const NO_EDITING_SIGNAL: EditingSignal = {
  detected: false,
  description: "No editing history detected in available metadata.",
};

// A conservative, real-metadata-only check: these strings are written
// verbatim into the Software EXIF tag by the tool itself when it saves a
// file. This is a direct reading, not an inference from appearance — and
// it only ever flags a small, explicit list of well-known editors, so it
// undercounts (misses tools not listed) rather than ever overclaiming.
const KNOWN_EDITOR_SIGNATURES = [
  "photoshop",
  "lightroom",
  "gimp",
  "affinity photo",
  "pixelmator",
  "capture one",
  "paint.net",
  "snapseed",
];

function detectEditingSignal(software: string | null): EditingSignal {
  if (!software) return NO_EDITING_SIGNAL;

  const match = KNOWN_EDITOR_SIGNATURES.find((signature) =>
    software.toLowerCase().includes(signature),
  );

  if (!match) return NO_EDITING_SIGNAL;

  return {
    detected: true,
    description: `The file's Software metadata field records "${software}".`,
  };
}

/**
 * Builds the full Provenance summary for a given file. Reuses
 * `inspectImage` (the same real-inspection primitive Analysis uses) for
 * format/resolution/size rather than re-deriving them a third time.
 */
export async function buildProvenanceSummary(
  file: File,
  previewUrl: string,
): Promise<ProvenanceSummary> {
  const [imageResult, metadata, c2pa] = await Promise.all([
    inspectImage(file, previewUrl),
    inspectMetadata(file),
    inspectC2pa(),
  ]);

  return {
    fileName: file.name,
    identity: {
      format: imageResult.format,
      resolution: imageResult.dimensions
        ? `${imageResult.dimensions.width} × ${imageResult.dimensions.height}`
        : "Not determined",
      fileSizeLabel: formatFileSize(imageResult.fileSizeBytes),
      colorSpace: metadata.colorSpace ?? "Not determined",
    },
    metadata,
    editing: detectEditingSignal(metadata.software),
    c2pa,
  };
}
