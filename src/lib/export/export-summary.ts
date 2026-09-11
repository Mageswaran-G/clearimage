import { formatFileSize } from "@/lib/format-file-size";
import { buildExportFilename } from "@/lib/export/filename";
import type { CleanupResultRecord } from "@/lib/cleanup/cleanup-result-store";
import type { ExportSummary } from "@/lib/export/types";

/**
 * Builds the Export screen's summary entirely from the real processed
 * result (dimensions, byte size, and MIME type all come straight from the
 * actual Blob Cleanup produced) plus the original filename for naming —
 * never from the original file's own format or size, which would describe
 * the wrong image.
 */
export function buildExportSummary(
  originalFileName: string,
  result: CleanupResultRecord,
): ExportSummary {
  return {
    previewUrl: result.url,
    downloadUrl: result.url,
    downloadFilename: buildExportFilename(originalFileName, result.blob.type),
    format: result.blob.type.replace("image/", "").toUpperCase(),
    resolution: `${result.width} × ${result.height}`,
    fileSizeLabel: formatFileSize(result.blob.size),
    fileSizeBytes: result.blob.size,
  };
}
