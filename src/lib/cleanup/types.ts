/**
 * A rectangular cleanup region ("mask"), in coordinates normalized to the
 * source image's natural size (0..1). Normalized coordinates keep the
 * region correct regardless of on-screen zoom/scale — the same region
 * always maps to the same real pixels in the source image.
 */
export interface CleanupRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Every operation the Cleanup catalog can show. Only a subset is actually
 * wired to real processing today (see operations.ts) — the rest exist so
 * the UI can show the intended full feature set honestly, as disabled
 * "not available yet" entries, rather than hiding them or faking a result.
 */
export type CleanupOperationId =
  | "blur-region"
  | "crop-region"
  | "remove-watermark"
  | "remove-text-overlay"
  | "remove-logo"
  | "reduce-artifacts";

/**
 * The real, honest state of one catalog entry:
 *  - "supported": a genuine processor exists and is reachable right now
 *    (the two Canvas operations always; a cloud operation only once a real,
 *    benchmarked CloudCleanupProvider is registered — see
 *    src/lib/cleanup/cloud/provider-registry.ts).
 *  - "coming-soon": a real architecture/seam exists for this operation
 *    (the cloud pipeline), but no approved provider is wired up yet.
 *  - "unavailable": no implementation and no concrete plan exists at all.
 */
export type CleanupOperationStatus =
  "supported" | "coming-soon" | "unavailable";

export interface CleanupOperation {
  id: CleanupOperationId;
  label: string;
  description: string;
  status: CleanupOperationStatus;
  /** Derived convenience: true only when status is "supported". Kept
   * alongside `status` (rather than replaced by it) since existing UI code
   * already reads a simple boolean to decide whether an operation can be
   * selected at all. */
  available: boolean;
}

/**
 * The real, observable state of the Cleanup workspace for one image.
 * "Missing image" isn't a member here — CleanupView handles that the same
 * way Inspect/Provenance do, before this state machine is ever reached.
 * There's also no separate "region-selected" state: a region only becomes
 * meaningful once it's valid and an operation is chosen, and this app
 * always has an operation pre-selected — so a valid region and "ready to
 * process" are the same real moment, not two distinct states to fake a
 * difference between.
 *
 * "uploading" and "retrying" exist for cloud operations specifically: a
 * browser-side Canvas operation (blur/crop) has no separate upload phase
 * and nothing to retry against (it either runs or throws immediately), so
 * those two states are simply never reached by the two operations that are
 * "supported" today. They exist now so the state machine is genuinely
 * ready for a cloud operation once one exists, rather than being
 * retrofitted later.
 */
export type CleanupState =
  | "loaded"
  | "ready"
  | "uploading"
  | "processing"
  | "success"
  | "error"
  | "retrying";

export interface CleanupOptions {
  /** Blur radius in CSS pixels, applied via the real Canvas 2D `filter`. */
  blurStrength: number;
}

export interface CleanupResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export type CleanupErrorKind =
  "invalid-region" | "unavailable-operation" | "processing-failed";

export class CleanupProcessingError extends Error {
  readonly kind: CleanupErrorKind;

  constructor(kind: CleanupErrorKind, message: string) {
    super(message);
    this.name = "CleanupProcessingError";
    this.kind = kind;
  }
}
