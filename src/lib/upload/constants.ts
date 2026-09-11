export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export const MAX_UPLOAD_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 25,
);

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/**
 * Safety ceiling on decoded pixel size, separate from the byte-size limit
 * above. Guards against a small file that decodes into an enormous bitmap
 * (for example a crafted PNG that declares absurd dimensions) consuming
 * excessive memory during decode or downstream processing. 10,000px per
 * side and 50 total megapixels comfortably covers real consumer and
 * prosumer photography — including large phone/DSLR/mirrorless output and
 * 8K stills — while still capping worst-case memory use per image.
 */
export const MAX_IMAGE_DIMENSION_PX = 10_000;
export const MAX_IMAGE_MEGAPIXELS = 50;
export const MAX_IMAGE_PIXELS = MAX_IMAGE_MEGAPIXELS * 1_000_000;

export const FILE_INPUT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
