import { NextResponse } from "next/server";
import { getCloudCleanupProvider } from "@/lib/cleanup/cloud/provider-registry";
import type { CloudCleanupProvider } from "@/lib/cleanup/cloud/cloud-cleanup-provider";
import { validateCloudRequest } from "@/lib/cleanup/cloud/validate-cloud-request";
import {
  CloudCleanupError,
  cloudCleanupErrorMessage,
} from "@/lib/cleanup/cloud/errors";
import type { CloudCleanupErrorCode } from "@/lib/cleanup/cloud/errors";
import {
  isCloudCleanupEnabled,
  cloudCleanupTimeoutMs,
  cloudCleanupMaxRequestBytes,
} from "@/lib/cleanup/cloud/config";

/**
 * POST /api/cleanup/process — the one server-side entry point for
 * cloud-based cleanup operations (content-aware watermark/text/logo
 * removal, artifact reduction). Browser-side operations (blur, crop) never
 * call this route — see src/lib/cleanup/canvas-processor.ts.
 *
 * Request: multipart/form-data with fields
 *   image        — the source image file (JPEG/PNG/WebP)
 *   operationId  — one of the CloudCleanupOperationId values
 *   region       — JSON-encoded CleanupRegion ({x,y,width,height}, 0..1)
 *
 * Response (success): 200, Content-Type set to the result's real MIME
 * type, the processed image bytes as the raw body. Metadata travels in
 * headers rather than wrapping the bytes in JSON/base64:
 *   X-ClearImage-Width, X-ClearImage-Height  — result pixel dimensions
 *   X-ClearImage-Total-Ms                    — end-to-end server time
 *
 * Response (error): JSON body { error: { code, message } }, where `code`
 * is a CloudCleanupErrorCode and `message` is the same safe, user-facing
 * text src/lib/cleanup/cloud/errors.ts defines — never a vendor error
 * string or stack trace. HTTP status varies by code (see statusForCode).
 *
 * Every input is re-validated from raw bytes here (validateCloudRequest)
 * regardless of what the browser already checked — see that module's own
 * doc comment for why.
 *
 * Request size is checked twice, deliberately: once against the
 * `Content-Length` header, before the body is read at all (see
 * CONTENT_LENGTH_OVERHEAD_ALLOWANCE_BYTES below), and again against the
 * real decoded image bytes inside validateCloudRequest. The first check is
 * what keeps an obviously oversized request from ever being buffered into
 * memory; the second remains the exact, authoritative limit on the image
 * itself. Neither replaces the other.
 */

function statusForCode(code: CloudCleanupErrorCode): number {
  switch (code) {
    case "INVALID_IMAGE":
    case "UNSUPPORTED_FORMAT":
    case "FILE_TOO_LARGE":
    case "INVALID_SELECTION":
    case "INVALID_OPERATION":
      return 400;
    case "PROVIDER_UNAVAILABLE":
      return 503;
    case "TIMEOUT":
      return 504;
    case "PROCESSING_FAILED":
    case "RESULT_INVALID":
      return 502;
  }
}

/**
 * Duck-typed rather than `instanceof Blob`/`instanceof File`: a
 * multipart-parsed file field can come from a different realm's
 * Blob/File constructor than the one this module's ambient `Blob` global
 * resolves to (observed directly in this project's own test environment,
 * where jsdom's FormData produces a File whose prototype chain isn't
 * `instanceof`-compatible with the runtime's own Blob) — checking for the
 * real capability this code actually needs is more robust than assuming a
 * shared constructor identity.
 */
function isBlobLike(value: unknown): value is Blob {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

// A multipart/form-data body is always somewhat larger than the image
// bytes it carries: two boundary lines and a Content-Disposition header
// per field, plus the small `operationId`/`region` fields themselves —
// realistically well under 1KB for this route's three fields. This
// allowance is generous headroom above that, so a request whose actual
// image is exactly at the configured limit is never rejected early only
// to have passed the exact byte-level check moments later.
const CONTENT_LENGTH_OVERHEAD_ALLOWANCE_BYTES = 16 * 1024;

/**
 * Rejects an obviously oversized request using only its `Content-Length`
 * header — before `request.formData()` reads and buffers the body at all.
 * Returns false (not exceeding) whenever the header is absent or
 * unparsable: a request sent without a usable Content-Length (e.g.
 * chunked transfer-encoding) still gets the same enforcement later,
 * exactly as before this change, via validateCloudRequest's exact byte
 * check on the parsed body — this early check is an additional layer for
 * the common case, not a replacement for that authoritative one.
 */
function contentLengthExceedsLimit(request: Request): boolean {
  const header = request.headers.get("content-length");
  if (!header) return false;
  const declaredBytes = Number(header);
  if (!Number.isFinite(declaredBytes) || declaredBytes < 0) return false;
  return (
    declaredBytes >
    cloudCleanupMaxRequestBytes() + CONTENT_LENGTH_OVERHEAD_ALLOWANCE_BYTES
  );
}

function errorResponse(code: CloudCleanupErrorCode): NextResponse {
  return NextResponse.json(
    { error: { code, message: cloudCleanupErrorMessage(code) } },
    { status: statusForCode(code) },
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new CloudCleanupError("TIMEOUT")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * The real handler, independent of Next.js's routing glue — exported so
 * tests can call it directly with a constructed Request and an injected
 * provider, without needing a running server or a real env-configured
 * vendor (none exists yet; see provider-registry.ts).
 */
export async function handleCleanupProcessRequest(
  request: Request,
  deps: { provider?: CloudCleanupProvider } = {},
): Promise<Response> {
  if (!isCloudCleanupEnabled()) {
    return errorResponse("PROVIDER_UNAVAILABLE");
  }

  if (contentLengthExceedsLimit(request)) {
    return errorResponse("FILE_TOO_LARGE");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_IMAGE");
  }

  const imageField = formData.get("image");
  if (!isBlobLike(imageField)) {
    return errorResponse("INVALID_IMAGE");
  }
  const imageBytes = new Uint8Array(await imageField.arrayBuffer());

  const operationIdRaw = formData.get("operationId");
  const regionRaw = formData.get("region");
  let parsedRegion: unknown = undefined;
  if (typeof regionRaw === "string") {
    try {
      parsedRegion = JSON.parse(regionRaw);
    } catch {
      return errorResponse("INVALID_SELECTION");
    }
  }

  let validated;
  try {
    validated = validateCloudRequest(imageBytes, operationIdRaw, parsedRegion);
  } catch (err) {
    if (err instanceof CloudCleanupError) return errorResponse(err.code);
    return errorResponse("INVALID_IMAGE");
  }

  const provider = deps.provider ?? getCloudCleanupProvider();
  if (!provider.isConfigured()) {
    return errorResponse("PROVIDER_UNAVAILABLE");
  }

  const startedAt = Date.now();
  try {
    const result = await withTimeout(
      provider.process({
        imageBytes: validated.imageBytes,
        mimeType: validated.mimeType,
        region: validated.region,
        operationId: validated.operationId,
      }),
      cloudCleanupTimeoutMs(),
    );

    if (!result.imageBytes || result.imageBytes.byteLength === 0) {
      return errorResponse("RESULT_INVALID");
    }
    if (!result.width || !result.height) {
      return errorResponse("RESULT_INVALID");
    }

    const totalMs = Date.now() - startedAt;
    return new NextResponse(new Uint8Array(result.imageBytes), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "X-ClearImage-Width": String(result.width),
        "X-ClearImage-Height": String(result.height),
        "X-ClearImage-Total-Ms": String(totalMs),
      },
    });
  } catch (err) {
    // Never forward the raw error to the client or log image bytes — only
    // a code-level summary. `err` itself may carry vendor-specific detail
    // once a real provider exists; that stays server-side only.
    const code: CloudCleanupErrorCode =
      err instanceof CloudCleanupError ? err.code : "PROCESSING_FAILED";
    console.error("[cloud-cleanup] provider failure", {
      provider: provider.name,
      code,
    });
    return errorResponse(code);
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleCleanupProcessRequest(request);
}
