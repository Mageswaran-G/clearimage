import type { CleanupRegion } from "@/lib/cleanup/types";
import type { CloudCleanupOperationId } from "@/lib/cleanup/cloud/cloud-cleanup-provider";
import {
  CloudCleanupError,
  type CloudCleanupErrorCode,
} from "@/lib/cleanup/cloud/errors";

export interface CloudCleanupClientResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

const KNOWN_ERROR_CODES: readonly CloudCleanupErrorCode[] = [
  "INVALID_IMAGE",
  "UNSUPPORTED_FORMAT",
  "FILE_TOO_LARGE",
  "INVALID_SELECTION",
  "INVALID_OPERATION",
  "PROCESSING_FAILED",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "RESULT_INVALID",
];

function isKnownErrorCode(value: unknown): value is CloudCleanupErrorCode {
  return (
    typeof value === "string" &&
    (KNOWN_ERROR_CODES as readonly string[]).includes(value)
  );
}

async function readErrorCode(
  response: Response,
): Promise<CloudCleanupErrorCode> {
  try {
    const body: unknown = await response.json();
    const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
    if (isKnownErrorCode(code)) return code;
  } catch {
    // Body wasn't JSON, or was JSON without the expected shape — fall
    // through to the generic code below rather than guessing.
  }
  return "PROCESSING_FAILED";
}

/**
 * Decodes and sanity-checks a cloud result before it's allowed anywhere
 * near cleanup-result-store/Export — never trust a provider's response
 * blindly, per this phase's own requirement. A response that fails any of
 * these checks is treated exactly like a provider error, never as a
 * degraded success.
 */
export function validateCloudCleanupResult(
  blob: Blob,
  expectedWidth: number,
  expectedHeight: number,
): Promise<CloudCleanupClientResult> {
  return new Promise((resolve, reject) => {
    if (!blob || blob.size === 0) {
      reject(new CloudCleanupError("RESULT_INVALID"));
      return;
    }
    if (
      !Number.isFinite(expectedWidth) ||
      !Number.isFinite(expectedHeight) ||
      expectedWidth <= 0 ||
      expectedHeight <= 0
    ) {
      reject(new CloudCleanupError("RESULT_INVALID"));
      return;
    }

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        URL.revokeObjectURL(url);
        reject(new CloudCleanupError("RESULT_INVALID"));
        return;
      }
      resolve({
        blob,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new CloudCleanupError("RESULT_INVALID"));
    };
    img.src = url;
  });
}

/**
 * Client-side entry point for a cloud cleanup operation — posts the source
 * image + selection to /api/cleanup/process and returns a validated,
 * ready-to-store result. Currently unreachable from the UI (every
 * CloudCleanupOperationId is shown as "coming soon" — see operations.ts
 * and cloud/config.ts), but the full request/response/validation path is
 * real and tested, so wiring it up later is a UI change only, not a new
 * architecture.
 */
export async function requestCloudCleanup(
  file: File,
  region: CleanupRegion,
  operationId: CloudCleanupOperationId,
  options: { signal?: AbortSignal } = {},
): Promise<CloudCleanupClientResult> {
  const formData = new FormData();
  formData.set("image", file, file.name);
  formData.set("operationId", operationId);
  formData.set("region", JSON.stringify(region));

  let response: Response;
  try {
    response = await fetch("/api/cleanup/process", {
      method: "POST",
      body: formData,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new CloudCleanupError(
      "PROCESSING_FAILED",
      "Could not reach the cleanup service. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new CloudCleanupError(await readErrorCode(response));
  }

  const width = Number(response.headers.get("X-ClearImage-Width"));
  const height = Number(response.headers.get("X-ClearImage-Height"));
  const blob = await response.blob();

  return validateCloudCleanupResult(blob, width, height);
}
