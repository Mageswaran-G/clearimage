/**
 * Every error a cloud cleanup request can end in, shared by the server
 * route, the provider interface, and the client. Deliberately small and
 * closed (a union, not a free-form string) so the UI can map every case to
 * a safe, specific message without ever needing to inspect a vendor error
 * string or stack trace.
 */
export type CloudCleanupErrorCode =
  | "INVALID_IMAGE"
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "INVALID_SELECTION"
  | "INVALID_OPERATION"
  | "PROCESSING_FAILED"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "RESULT_INVALID";

const ERROR_MESSAGES: Record<CloudCleanupErrorCode, string> = {
  INVALID_IMAGE: "This image could not be read. Please try a different file.",
  UNSUPPORTED_FORMAT:
    "Unsupported format. Please use a JPG, PNG, or WebP image.",
  FILE_TOO_LARGE: "This image is too large to send for cloud cleanup.",
  INVALID_SELECTION: "The selected area is too small or invalid.",
  INVALID_OPERATION: "This cleanup operation is not available.",
  PROCESSING_FAILED:
    "Cloud cleanup could not process this image. Please try again.",
  PROVIDER_UNAVAILABLE: "Cloud cleanup is not available right now.",
  TIMEOUT: "Cloud cleanup took too long and was stopped. Please try again.",
  RESULT_INVALID:
    "Cloud cleanup returned an unusable result. Please try again.",
};

/**
 * Thrown by a CloudCleanupProvider (or the request validator in front of
 * it) for every failure case. Never carries vendor-specific detail — the
 * `code` is what the UI and the API route are allowed to see and forward;
 * anything provider-specific stays in server logs only (see route.ts),
 * never in the thrown message or the HTTP response body.
 */
export class CloudCleanupError extends Error {
  readonly code: CloudCleanupErrorCode;

  constructor(
    code: CloudCleanupErrorCode,
    message: string = ERROR_MESSAGES[code],
  ) {
    super(message);
    this.name = "CloudCleanupError";
    this.code = code;
  }
}

/** The single place that turns a code into what a user actually reads. */
export function cloudCleanupErrorMessage(code: CloudCleanupErrorCode): string {
  return ERROR_MESSAGES[code];
}
