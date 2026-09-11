export interface ImageDimensions {
  width: number;
  height: number;
}

export type InspectionStatus = "valid" | "invalid";

export interface InspectionResult {
  status: InspectionStatus;
  /** e.g. "JPEG", "PNG", "WEBP" */
  format: string;
  mimeType: string;
  fileSizeBytes: number;
  fileName: string;
  dimensions: ImageDimensions | null;
  integrityPassed: boolean;
}
