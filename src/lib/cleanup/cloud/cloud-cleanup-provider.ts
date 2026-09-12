import type { CleanupOperationId, CleanupRegion } from "@/lib/cleanup/types";
import { CloudCleanupError } from "@/lib/cleanup/cloud/errors";

/** Cleanup operations that require cloud/GPU inference rather than a plain
 * Canvas operation. A strict subset of CleanupOperationId — this interface
 * is never asked to run "blur-region"/"crop-region", which stay entirely
 * client-side (see canvas-processor.ts). */
export type CloudCleanupOperationId = Exclude<
  CleanupOperationId,
  "blur-region" | "crop-region"
>;

export interface CloudCleanupRequest {
  /** Raw source image bytes, already validated (signature + size + dimensions). */
  imageBytes: Uint8Array;
  /** The real, signature-verified MIME type of imageBytes. */
  mimeType: string;
  /** The selected region, normalized 0..1 — same shape used everywhere else in Cleanup. */
  region: CleanupRegion;
  operationId: CloudCleanupOperationId;
  /** Room for future per-operation knobs, without changing this interface's shape. */
  parameters?: Record<string, unknown>;
}

export interface CloudCleanupResult {
  imageBytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
  /** Present when the provider reports it; never fabricated when absent. */
  timing?: {
    totalMs: number;
    providerMs?: number;
  };
}

/**
 * The seam between ClearImage and any real GPU/cloud inference vendor.
 * Nothing outside src/lib/cleanup/cloud/ and the API route that calls it
 * should ever know which provider is active, or how it talks to its
 * backend — swapping vendors means writing one new class here and pointing
 * the registry (see provider-registry.ts) at it, never touching the
 * Cleanup UI or the route handler's request/response contract.
 */
export interface CloudCleanupProvider {
  /** Short, human-readable identifier for logs/diagnostics — never shown
   * to end users as-is (see errors.ts for user-facing messages). */
  readonly name: string;

  /** True only when this provider has everything it needs to actually run
   * (e.g. an endpoint + API key configured) — never true for a stub. */
  isConfigured(): boolean;

  /**
   * Runs one cleanup operation. Must throw CloudCleanupError for every
   * failure case (never return a partial/placeholder result) — callers
   * treat a resolved promise as a genuine, usable result.
   */
  process(request: CloudCleanupRequest): Promise<CloudCleanupResult>;
}

/**
 * The default provider while no real GPU vendor is connected. Always
 * reports itself as unconfigured and always fails with PROVIDER_UNAVAILABLE
 * — this is what keeps the architecture honest per Phase 8's own finding
 * that the LaMa model is not yet approved for production: the seam exists
 * and is fully wired, but nothing behind it claims to work until a real
 * provider (backed by a benchmarked, approved model) replaces this one.
 */
export class NullCloudCleanupProvider implements CloudCleanupProvider {
  readonly name = "null";

  isConfigured(): boolean {
    return false;
  }

  async process(): Promise<CloudCleanupResult> {
    throw new CloudCleanupError("PROVIDER_UNAVAILABLE");
  }
}
