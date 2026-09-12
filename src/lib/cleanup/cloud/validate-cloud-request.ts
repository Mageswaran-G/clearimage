import {
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_PIXELS,
} from "@/lib/upload/constants";
import {
  detectImageSignature,
  SIGNATURE_HEADER_BYTES,
  SIGNATURE_MIME_TYPE,
} from "@/lib/upload/image-signature";
import { readImageDimensionsFromBytes } from "@/lib/upload/read-image-dimensions-from-bytes";
import { isValidRegion } from "@/lib/cleanup/region";
import type { CleanupRegion } from "@/lib/cleanup/types";
import { type CloudCleanupOperationId } from "@/lib/cleanup/cloud/cloud-cleanup-provider";
import { CloudCleanupError } from "@/lib/cleanup/cloud/errors";
import { cloudCleanupMaxRequestBytes } from "@/lib/cleanup/cloud/config";

const CLOUD_OPERATION_IDS: readonly CloudCleanupOperationId[] = [
  "remove-watermark",
  "remove-text-overlay",
  "remove-logo",
  "reduce-artifacts",
];

function isCloudOperationId(value: unknown): value is CloudCleanupOperationId {
  return (
    typeof value === "string" &&
    (CLOUD_OPERATION_IDS as readonly string[]).includes(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Structural check only — real bounds (0..1, minimum size) are enforced
 * by isValidRegion, reused as-is from the browser-side Cleanup code so the
 * two never drift apart. */
function isRegionShaped(value: unknown): value is CleanupRegion {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    isFiniteNumber(r.x) &&
    isFiniteNumber(r.y) &&
    isFiniteNumber(r.width) &&
    isFiniteNumber(r.height)
  );
}

export interface ValidatedCloudRequest {
  imageBytes: Uint8Array;
  mimeType: string;
  region: CleanupRegion;
  operationId: CloudCleanupOperationId;
}

/**
 * Re-validates everything the browser already checked, from scratch,
 * against the raw bytes and fields actually received — the browser-side
 * checks in src/lib/upload/validate-image.ts protect the user's own
 * workflow, they say nothing about what a request that reaches this server
 * route actually contains. Throws CloudCleanupError for every failure;
 * never returns a partially-valid result.
 */
export function validateCloudRequest(
  imageBytes: Uint8Array,
  operationIdRaw: unknown,
  regionRaw: unknown,
): ValidatedCloudRequest {
  if (imageBytes.byteLength === 0) {
    throw new CloudCleanupError("INVALID_IMAGE");
  }

  if (imageBytes.byteLength > cloudCleanupMaxRequestBytes()) {
    throw new CloudCleanupError("FILE_TOO_LARGE");
  }

  if (imageBytes.byteLength < SIGNATURE_HEADER_BYTES) {
    throw new CloudCleanupError("INVALID_IMAGE");
  }

  const signature = detectImageSignature(
    imageBytes.subarray(0, SIGNATURE_HEADER_BYTES),
  );
  if (!signature) {
    throw new CloudCleanupError("UNSUPPORTED_FORMAT");
  }
  const mimeType = SIGNATURE_MIME_TYPE[signature];

  const dimensions = readImageDimensionsFromBytes(imageBytes, signature);
  if (!dimensions) {
    throw new CloudCleanupError("INVALID_IMAGE");
  }
  if (
    dimensions.width > MAX_IMAGE_DIMENSION_PX ||
    dimensions.height > MAX_IMAGE_DIMENSION_PX ||
    dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
  ) {
    throw new CloudCleanupError("INVALID_IMAGE");
  }

  if (!isCloudOperationId(operationIdRaw)) {
    throw new CloudCleanupError("INVALID_OPERATION");
  }

  if (!isRegionShaped(regionRaw) || !isValidRegion(regionRaw)) {
    throw new CloudCleanupError("INVALID_SELECTION");
  }

  return {
    imageBytes,
    mimeType,
    region: regionRaw,
    operationId: operationIdRaw,
  };
}
