import { describe, expect, it } from "vitest";
import {
  SECONDARY_FINDINGS,
  buildPrimaryFindings,
  overallStatus,
} from "@/lib/inspect/findings";
import type { InspectionResult } from "@/lib/inspect/types";

const validResult: InspectionResult = {
  status: "valid",
  format: "JPEG",
  mimeType: "image/jpeg",
  fileSizeBytes: 1024,
  fileName: "photo.jpg",
  dimensions: { width: 800, height: 600 },
  integrityPassed: true,
};

describe("buildPrimaryFindings", () => {
  it("marks integrity and format as passed/valid for a valid result", () => {
    const findings = buildPrimaryFindings(validResult);
    expect(findings.find((f) => f.title === "File integrity")?.status).toBe(
      "Passed",
    );
    expect(findings.find((f) => f.title === "Format")?.status).toBe("Valid");
  });

  it("never claims Metadata was analyzed", () => {
    const findings = buildPrimaryFindings(validResult);
    const metadata = findings.find((f) => f.title === "Metadata");
    expect(metadata?.status).toBe("Not analyzed");
  });

  it("marks integrity and format as failed/invalid for an invalid result", () => {
    const invalidResult: InspectionResult = {
      ...validResult,
      status: "invalid",
      integrityPassed: false,
    };
    const findings = buildPrimaryFindings(invalidResult);
    expect(findings.find((f) => f.title === "File integrity")?.status).toBe(
      "Failed",
    );
    expect(findings.find((f) => f.title === "Format")?.status).toBe("Invalid");
  });
});

describe("SECONDARY_FINDINGS", () => {
  it("never claims C2PA or watermark detection was performed", () => {
    for (const finding of SECONDARY_FINDINGS) {
      expect(finding.status).toBe("Not yet available");
      expect(finding.status).not.toMatch(/detected/i);
    }
  });
});

describe("overallStatus", () => {
  it("reports Ready for a valid result", () => {
    expect(overallStatus(validResult).label).toBe("Ready");
  });

  it("reports Error for an invalid result", () => {
    expect(overallStatus({ ...validResult, status: "invalid" }).label).toBe(
      "Error",
    );
  });
});
