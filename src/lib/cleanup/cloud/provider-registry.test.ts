import { afterEach, describe, expect, it, vi } from "vitest";
import { getCloudCleanupProvider } from "@/lib/cleanup/cloud/provider-registry";
import {
  NullCloudCleanupProvider,
  type CloudCleanupProvider,
} from "@/lib/cleanup/cloud/cloud-cleanup-provider";
import { CloudCleanupError } from "@/lib/cleanup/cloud/errors";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCloudCleanupProvider", () => {
  it("returns the Null provider by default (no CLOUD_CLEANUP_PROVIDER set)", () => {
    expect(getCloudCleanupProvider()).toBeInstanceOf(NullCloudCleanupProvider);
  });

  it("returns the Null provider for an explicit 'none'", () => {
    vi.stubEnv("CLOUD_CLEANUP_PROVIDER", "none");
    expect(getCloudCleanupProvider()).toBeInstanceOf(NullCloudCleanupProvider);
  });

  it("falls back to the Null provider for an unrecognized provider name, rather than throwing", () => {
    vi.stubEnv(
      "CLOUD_CLEANUP_PROVIDER",
      "some-future-vendor-not-implemented-yet",
    );
    expect(getCloudCleanupProvider()).toBeInstanceOf(NullCloudCleanupProvider);
  });
});

describe("NullCloudCleanupProvider", () => {
  it("reports itself as not configured", () => {
    expect(new NullCloudCleanupProvider().isConfigured()).toBe(false);
  });

  it("always rejects with PROVIDER_UNAVAILABLE", async () => {
    const provider: CloudCleanupProvider = new NullCloudCleanupProvider();
    await expect(
      provider.process({
        imageBytes: new Uint8Array(),
        mimeType: "image/png",
        region: { x: 0, y: 0, width: 1, height: 1 },
        operationId: "remove-watermark",
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("never resolves with a fabricated result", async () => {
    const provider: CloudCleanupProvider = new NullCloudCleanupProvider();
    await expect(
      provider.process({
        imageBytes: new Uint8Array(),
        mimeType: "image/png",
        region: { x: 0, y: 0, width: 1, height: 1 },
        operationId: "remove-watermark",
      }),
    ).rejects.toBeInstanceOf(CloudCleanupError);
  });
});
