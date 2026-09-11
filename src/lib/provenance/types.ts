export interface FileIdentity {
  format: string;
  resolution: string;
  fileSizeLabel: string;
  /** Only ever a real, determined value — "Not determined" when we can't tell. */
  colorSpace: string;
}

export interface MetadataSummary {
  hasExifData: boolean;
  cameraMake: string | null;
  cameraModel: string | null;
  /** Pre-formatted for display, e.g. "March 4, 2024". */
  captureDate: string | null;
  /** Raw Software/CreatingApplication tag value, unedited — never guessed. */
  software: string | null;
  orientation: string | null;
  bitDepth: string | null;
  compression: string | null;
  /** Real value derived from EXIF ColorSpace or an embedded ICC profile; null when not determinable. */
  colorSpace: string | null;
  /**
   * Whether GPS coordinates are embedded. This is the ONLY GPS signal ever
   * exposed outside this module — the actual coordinates are never read
   * into this type, so the UI has no way to accidentally render them.
   */
  hasGpsData: boolean;
}

export interface EditingSignal {
  detected: boolean;
  /** Always the exact approved copy for the "not detected" case. */
  description: string;
}

export type C2paStatus = "unavailable";

export interface C2paResult {
  status: C2paStatus;
  message: string;
}

export interface ProvenanceSummary {
  fileName: string;
  identity: FileIdentity;
  metadata: MetadataSummary;
  editing: EditingSignal;
  c2pa: C2paResult;
}
