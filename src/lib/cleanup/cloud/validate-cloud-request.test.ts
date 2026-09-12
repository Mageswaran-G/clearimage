import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCloudRequest } from "@/lib/cleanup/cloud/validate-cloud-request";
import { CloudCleanupError } from "@/lib/cleanup/cloud/errors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PNG = new Uint8Array(
  readFileSync(path.join(__dirname, "../../../../e2e/fixtures/test-image.png")),
);
const VALID_REGION = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 };

function expectCode(fn: () => void, code: string) {
  try {
    fn();
    expect.unreachable("expected validateCloudRequest to throw");
  } catch (err) {
    expect(err).toBeInstanceOf(CloudCleanupError);
    expect((err as CloudCleanupError).code).toBe(code);
  }
}

describe("validateCloudRequest", () => {
  it("accepts a real PNG with a valid region and operation", () => {
    const result = validateCloudRequest(
      REAL_PNG,
      "remove-watermark",
      VALID_REGION,
    );
    expect(result.mimeType).toBe("image/png");
    expect(result.operationId).toBe("remove-watermark");
    expect(result.region).toEqual(VALID_REGION);
  });

  it("rejects an empty buffer as INVALID_IMAGE", () => {
    expectCode(
      () =>
        validateCloudRequest(
          new Uint8Array(0),
          "remove-watermark",
          VALID_REGION,
        ),
      "INVALID_IMAGE",
    );
  });

  it("rejects bytes that don't match any known signature as UNSUPPORTED_FORMAT", () => {
    const junk = new Uint8Array(32).fill(0x41);
    expectCode(
      () => validateCloudRequest(junk, "remove-watermark", VALID_REGION),
      "UNSUPPORTED_FORMAT",
    );
  });

  it("rejects a request over the max cloud request size as FILE_TOO_LARGE", () => {
    const oversized = new Uint8Array(9 * 1024 * 1024);
    oversized.set(
      REAL_PNG.subarray(0, Math.min(REAL_PNG.length, oversized.length)),
    );
    expectCode(
      () => validateCloudRequest(oversized, "remove-watermark", VALID_REGION),
      "FILE_TOO_LARGE",
    );
  });

  it("rejects an unknown operation id as INVALID_OPERATION", () => {
    expectCode(
      () =>
        validateCloudRequest(REAL_PNG, "not-a-real-operation", VALID_REGION),
      "INVALID_OPERATION",
    );
  });

  it("rejects blur-region/crop-region as INVALID_OPERATION (those never reach the cloud)", () => {
    expectCode(
      () => validateCloudRequest(REAL_PNG, "blur-region", VALID_REGION),
      "INVALID_OPERATION",
    );
  });

  it("rejects a malformed region shape as INVALID_SELECTION", () => {
    expectCode(
      () => validateCloudRequest(REAL_PNG, "remove-watermark", { x: 0.1 }),
      "INVALID_SELECTION",
    );
  });

  it("rejects an out-of-bounds region as INVALID_SELECTION", () => {
    expectCode(
      () =>
        validateCloudRequest(REAL_PNG, "remove-watermark", {
          x: 0.9,
          y: 0.9,
          width: 0.5,
          height: 0.5,
        }),
      "INVALID_SELECTION",
    );
  });

  it("rejects a too-small region as INVALID_SELECTION", () => {
    expectCode(
      () =>
        validateCloudRequest(REAL_PNG, "remove-watermark", {
          x: 0.1,
          y: 0.1,
          width: 0.001,
          height: 0.001,
        }),
      "INVALID_SELECTION",
    );
  });

  it("rejects a missing region entirely as INVALID_SELECTION", () => {
    expectCode(
      () => validateCloudRequest(REAL_PNG, "remove-watermark", undefined),
      "INVALID_SELECTION",
    );
  });
});
