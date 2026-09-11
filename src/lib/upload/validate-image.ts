import {
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  SUPPORTED_MIME_TYPES,
} from "@/lib/upload/constants";

export type ValidationErrorKind =
  "unsupported-format" | "too-large" | "corrupt" | "unknown";

export interface ValidationError {
  kind: ValidationErrorKind;
  message: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImage {
  file: File;
  previewUrl: string;
  dimensions: ImageDimensions;
}

export type ProcessResult =
  { ok: true; value: ProcessedImage } | { ok: false; error: ValidationError };

const ERROR_MESSAGES: Record<ValidationErrorKind, string> = {
  "unsupported-format":
    "Unsupported format. Please upload a JPG, PNG, or WebP image.",
  "too-large": `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`,
  corrupt: "Invalid image. The file could not be read.",
  unknown: "Something went wrong while reading this file. Please try again.",
};

function failure(kind: ValidationErrorKind): {
  ok: false;
  error: ValidationError;
} {
  return { ok: false, error: { kind, message: ERROR_MESSAGES[kind] } };
}

/** Decodes an object URL to confirm it's a real, readable image and to read its pixel size. */
function readImageDimensions(objectUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("corrupt"));
    img.src = objectUrl;
  });
}

/**
 * Validates a user-selected file and, on success, produces a temporary
 * object-URL preview plus its pixel dimensions. Runs entirely client-side —
 * no network request. Order matches the approved spec: format, then size,
 * then a real decode (catches corrupt files and reads dimensions together).
 */
export async function processSelectedFile(file: File): Promise<ProcessResult> {
  try {
    if (
      !SUPPORTED_MIME_TYPES.includes(
        file.type as (typeof SUPPORTED_MIME_TYPES)[number],
      )
    ) {
      return failure("unsupported-format");
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return failure("too-large");
    }

    const previewUrl = URL.createObjectURL(file);

    try {
      const dimensions = await readImageDimensions(previewUrl);
      return { ok: true, value: { file, previewUrl, dimensions } };
    } catch {
      URL.revokeObjectURL(previewUrl);
      return failure("corrupt");
    }
  } catch {
    return failure("unknown");
  }
}
