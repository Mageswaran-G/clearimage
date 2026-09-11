/**
 * The real, observable Export state. There's no "loading" member: both
 * source and processed-result reads are synchronous (in-memory store
 * lookups), so there's nothing to show a loading state for — and no
 * "exporting" member either, since a client-side Blob download has no
 * real async gap between the click and the browser taking over; adding a
 * transitional state there would mean faking a delay that doesn't exist.
 * "Missing source" / "missing result" aren't members here either — they're
 * handled as their own empty states before this machine is ever reached,
 * the same way Inspect/Provenance/Cleanup already handle "no image".
 */
export type ExportState = "ready" | "success" | "error";

export interface ExportSummary {
  previewUrl: string;
  downloadUrl: string;
  downloadFilename: string;
  /** Uppercase short form, e.g. "PNG", "JPEG", "WEBP". */
  format: string;
  resolution: string;
  fileSizeLabel: string;
  fileSizeBytes: number;
}
