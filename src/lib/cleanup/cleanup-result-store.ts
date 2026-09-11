import type { CleanupOperationId } from "@/lib/cleanup/types";

export interface CleanupResultRecord {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  operationId: CleanupOperationId;
  createdAt: number;
}

/**
 * Temporary, in-memory hand-off between Cleanup and Export — the same
 * pattern and the same route id as temp-image-store.ts, but for the
 * *processed* result rather than the original upload. Deliberately NOT
 * sessionStorage/localStorage/base64: the Blob and its object-URL preview
 * live only in this module's memory for as long as the tab stays open.
 *
 * Kept as its own small store (rather than folded into TempImageRecord) so
 * the original source and the processed result stay two clearly separate
 * records under the same id — Export must never confuse one for the other.
 */
const store = new Map<string, CleanupResultRecord>();

/**
 * Saves the latest processed result for an id, replacing (and revoking)
 * any previous one — matches "Re-run Cleanup": only the newest result is
 * ever the exportable one.
 */
export function saveCleanupResult(
  id: string,
  record: Omit<CleanupResultRecord, "createdAt">,
): void {
  const existing = store.get(id);
  if (existing && existing.url !== record.url) {
    URL.revokeObjectURL(existing.url);
  }
  store.set(id, { ...record, createdAt: Date.now() });
}

export function getCleanupResult(id: string): CleanupResultRecord | undefined {
  return store.get(id);
}

export function deleteCleanupResult(id: string): void {
  const record = store.get(id);
  if (record) URL.revokeObjectURL(record.url);
  store.delete(id);
}
