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

// This app carries one image through the workflow at a time (the same id
// flows through Upload -> Inspect -> Provenance -> Cleanup -> Export via the
// route). Tracking that id here lets saveTempImage clean up automatically
// when it's superseded — see below.
let currentId: string | null = null;

export function createTempImageId(): string {
  return crypto.randomUUID();
}

/**
 * Saves a new temporary record, keyed by id.
 *
 * If a previous record is still active (the id most recently saved and not
 * yet replaced), it is deleted first — revoking its object URL and freeing
 * the File reference. This is the workflow's cleanup boundary: starting a
 * new upload implicitly abandons whatever image was previously in
 * progress, which is exactly the scenario that otherwise leaks (e.g. the
 * user navigates back to Upload and selects a different file). Records for
 * an id still in use by Inspect/Provenance/Cleanup/Export are never
 * touched here, since they only stop being "current" once superseded by a
 * new save.
 */
export function saveTempImage(
  id: string,
  record: Omit<TempImageRecord, "createdAt">,
): void {
  if (currentId && currentId !== id) {
    deleteTempImage(currentId);
  }
  store.set(id, { ...record, createdAt: Date.now() });
  currentId = id;
}

export function getTempImage(id: string): TempImageRecord | undefined {
  return store.get(id);
}

export function deleteTempImage(id: string): void {
  const record = store.get(id);
  if (record) URL.revokeObjectURL(record.previewUrl);
  store.delete(id);
  if (currentId === id) currentId = null;
}
