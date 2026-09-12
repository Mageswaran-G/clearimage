import type {
  CleanupOperation,
  CleanupOperationStatus,
} from "@/lib/cleanup/types";

/**
 * Status for the three cloud-backed operations. Unconditionally
 * "coming-soon" today: per Phase 8's own findings, no CloudCleanupProvider
 * has passed GPU/quality benchmarking yet (see src/lib/cleanup/cloud/ and
 * the Phase 8 research notes), so there is nothing honest to mark
 * "supported" — this catalog doesn't read any env var to decide UI status;
 * CLOUD_CLEANUP_ENABLED is a server-side kill switch the API route always
 * re-checks independently (see src/app/api/cleanup/process/route.ts), not
 * something this catalog uses to promise a working feature. The day a
 * specific operation's provider is approved, that operation's status here
 * becomes "supported" as a
 * deliberate, reviewed catalog edit — never inferred automatically from an
 * env var, since "an env var is set" and "a model is actually good enough"
 * are not the same fact.
 */
const CLOUD_OPERATION_STATUS: CleanupOperationStatus = "coming-soon";

function operation(
  id: CleanupOperation["id"],
  label: string,
  description: string,
  status: CleanupOperationStatus,
): CleanupOperation {
  return { id, label, description, status, available: status === "supported" };
}

/**
 * The full Cleanup operation catalog. Only "blur-region" and "crop-region"
 * are wired to real processing today (see canvas-processor.ts) — both are
 * plain, genuine pixel operations a browser Canvas can actually perform.
 *
 * The three content-aware removal operations describe real, architected
 * cloud processing (see src/lib/cleanup/cloud/) — the server route,
 * validation, and provider interface all exist — but no provider has
 * passed the GPU/quality benchmark yet (see Phase 8 research), so they are
 * always "coming-soon" today, never silently "supported". "Reduce
 * artifacts" has no concrete implementation plan at all and is listed as
 * "unavailable" — a genuinely different, weaker claim than "coming soon".
 */
export const CLEANUP_OPERATIONS: CleanupOperation[] = [
  operation(
    "blur-region",
    "Blur selected area",
    "Applies a real blur to the area you select, obscuring it without changing the image size.",
    "supported",
  ),
  operation(
    "crop-region",
    "Crop to selection",
    "Crops the image down to only the area you select, discarding everything outside it.",
    "supported",
  ),
  operation(
    "remove-watermark",
    "Remove watermark",
    "Authorized, content-aware watermark cleanup — cloud-based, coming soon.",
    CLOUD_OPERATION_STATUS,
  ),
  operation(
    "remove-text-overlay",
    "Remove text overlay",
    "Authorized, content-aware text overlay cleanup — cloud-based, coming soon.",
    CLOUD_OPERATION_STATUS,
  ),
  operation(
    "remove-logo",
    "Remove logo / stamp",
    "Authorized, content-aware logo cleanup — cloud-based, coming soon.",
    CLOUD_OPERATION_STATUS,
  ),
  operation(
    "reduce-artifacts",
    "Reduce artifacts",
    "Automatic artifact reduction is not available yet.",
    "unavailable",
  ),
];

export const DEFAULT_CLEANUP_OPERATION_ID = "blur-region";
