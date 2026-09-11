import type { ImageDimensions } from "@/lib/upload/validate-image";

export interface TempImageRecord {
  file: File;
  previewUrl: string;
  dimensions: ImageDimensions;
  createdAt: number;
}

/**
 * Temporary, in-memory hand-off between Upload and the next step (Inspect).
 *
 * This is deliberately NOT sessionStorage/localStorage: the File object and
 * its object-URL preview live only in this module's memory for as long as
 * the tab stays open, keyed by a random id carried in the route
 * (/inspect/[id]). No image bytes are serialized or persisted anywhere.
 *
 * Known limitation: a hard reload of /inspect/[id] loses the record, since
 * nothing is written to disk or a server. That's expected for this phase —
 * this whole module is the seam a later phase replaces with a real
 * browser -> backend upload endpoint -> temporary server storage pipeline.
 */
const store = new Map<string, TempImageRecord>();

export function createTempImageId(): string {
  return crypto.randomUUID();
}

export function saveTempImage(
  id: string,
  record: Omit<TempImageRecord, "createdAt">,
): void {
  store.set(id, { ...record, createdAt: Date.now() });
}

export function getTempImage(id: string): TempImageRecord | undefined {
  return store.get(id);
}

export function deleteTempImage(id: string): void {
  const record = store.get(id);
  if (record) URL.revokeObjectURL(record.previewUrl);
  store.delete(id);
}
