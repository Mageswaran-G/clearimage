import type { InspectionResult } from "@/lib/inspect/types";

export interface Finding {
  title: string;
  /** Present for "primary" findings; omitted for "secondary" ones (title + status only). */
  detail?: string;
  status: string;
  dotClassName: string;
}

/**
 * Findings derived only from what this phase's inspection actually checks.
 * Provenance (C2PA) and visible-mark detection are NOT implemented yet —
 * they are listed as "Not yet available" secondary findings rather than
 * given a fabricated detected/not-detected result.
 */
export function buildPrimaryFindings(result: InspectionResult): Finding[] {
  return [
    {
      title: "File integrity",
      detail: result.integrityPassed
        ? "The file was decoded successfully with no errors."
        : "The file could not be decoded without errors.",
      status: result.integrityPassed ? "Passed" : "Failed",
      dotClassName: result.integrityPassed ? "bg-success" : "bg-error",
    },
    {
      title: "Format",
      detail:
        result.status === "valid"
          ? `Recognized as a valid ${result.format} file.`
          : "The file format could not be confirmed.",
      status: result.status === "valid" ? "Valid" : "Invalid",
      dotClassName: result.status === "valid" ? "bg-success" : "bg-error",
    },
    {
      title: "Metadata",
      detail: "Embedded metadata (EXIF, etc.) is not analyzed in this version.",
      status: "Not analyzed",
      dotClassName: "bg-text-secondary",
    },
  ];
}

export const SECONDARY_FINDINGS: Finding[] = [
  {
    title: "Content Credentials (C2PA)",
    status: "Not yet available",
    dotClassName: "bg-[#A8B0AE]",
  },
  {
    title: "Visible mark detection",
    status: "Not yet available",
    dotClassName: "bg-[#A8B0AE]",
  },
];

export function overallStatus(result: InspectionResult): {
  label: string;
  className: string;
} {
  return result.status === "valid"
    ? { label: "Ready", className: "text-success" }
    : { label: "Error", className: "text-error" };
}
