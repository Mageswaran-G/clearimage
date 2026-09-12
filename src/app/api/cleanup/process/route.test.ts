// @vitest-environment node
//
// This route handler is server-only Fetch API code (Request/FormData/Blob),
// never rendered DOM. Running it under the project's default jsdom
// environment causes a real cross-realm bug: jsdom's own FormData/Blob
// classes are not interoperable with the native (undici) Request that
// next/server's runtime actually uses — a Request built from a jsdom
// FormData/Blob serializes to a malformed multipart body that then
// deserializes back with truncated content. Forcing Node's environment for
// this file keeps every Fetch API object in the same realm, matching how
// this route actually runs in production.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleCleanupProcessRequest } from "@/app/api/cleanup/process/route";
import { CloudCleanupError } from "@/lib/cleanup/cloud/errors";
import type {
  CloudCleanupProvider,
  CloudCleanupResult,
} from "@/lib/cleanup/cloud/cloud-cleanup-provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_PNG = readFileSync(
  path.join(__dirname, "../../../../../e2e/fixtures/test-image.png"),
);
const VALID_REGION = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 };

function buildRequest(fields: {
  image?: Blob | null;
  operationId?: string;
  region?: unknown;
  /**
   * Node's undici does not compute a Content-Length header for a locally
   * constructed Request with a FormData body (verified directly: it comes
   * back null), unlike a real incoming HTTP request — a real browser
   * `fetch()` sending a fully-buffered FormData body (no File/Blob backed
   * by a stream) does send a real Content-Length, and that is what a
   * production Next.js route actually receives. Tests that exercise the
   * Content-Length-based early size guard pass this explicitly to
   * reproduce that real-world header; tests that don't set it correctly
   * exercise the guard's "header absent" fallback path instead.
   */
  contentLength?: number;
}): Request {
  const formData = new FormData();
  if (fields.image !== undefined && fields.image !== null) {
    formData.set("image", fields.image, "test.png");
  }
  if (fields.operationId !== undefined) {
    formData.set("operationId", fields.operationId);
  }
  if (fields.region !== undefined) {
    formData.set("region", JSON.stringify(fields.region));
  }
  return new Request("http://localhost/api/cleanup/process", {
    method: "POST",
    body: formData,
    headers:
      fields.contentLength !== undefined
        ? { "content-length": String(fields.contentLength) }
        : undefined,
  });
}

class FakeSuccessProvider implements CloudCleanupProvider {
  readonly name = "fake-success";
  isConfigured(): boolean {
    return true;
  }
  async process(): Promise<CloudCleanupResult> {
    return {
      imageBytes: new Uint8Array(REAL_PNG),
      mimeType: "image/png",
      width: 100,
      height: 100,
      timing: { totalMs: 42 },
    };
  }
}

class FakeFailureProvider implements CloudCleanupProvider {
  readonly name = "fake-failure";
  isConfigured(): boolean {
    return true;
  }
  async process(): Promise<CloudCleanupResult> {
    throw new CloudCleanupError("PROCESSING_FAILED");
  }
}

class FakeUnconfiguredProvider implements CloudCleanupProvider {
  readonly name = "fake-unconfigured";
  isConfigured(): boolean {
    return false;
  }
  async process(): Promise<CloudCleanupResult> {
    throw new CloudCleanupError("PROVIDER_UNAVAILABLE");
  }
}

class FakeInvalidResultProvider implements CloudCleanupProvider {
  readonly name = "fake-invalid-result";
  isConfigured(): boolean {
    return true;
  }
  async process(): Promise<CloudCleanupResult> {
    return {
      imageBytes: new Uint8Array(0),
      mimeType: "image/png",
      width: 0,
      height: 0,
    };
  }
}

class FakeSlowProvider implements CloudCleanupProvider {
  readonly name = "fake-slow";
  isConfigured(): boolean {
    return true;
  }
  async process(): Promise<CloudCleanupResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      imageBytes: new Uint8Array(REAL_PNG),
      mimeType: "image/png",
      width: 100,
      height: 100,
    };
  }
}

describe("POST /api/cleanup/process", () => {
  beforeEach(() => {
    vi.stubEnv("CLOUD_CLEANUP_ENABLED", "true");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns PROVIDER_UNAVAILABLE (503) when cloud cleanup is disabled, before touching any provider", async () => {
    vi.stubEnv("CLOUD_CLEANUP_ENABLED", "false");
    const provider = new FakeSuccessProvider();
    const spy = vi.spyOn(provider, "process");

    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, { provider });

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("PROVIDER_UNAVAILABLE");
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns INVALID_IMAGE (400) when no image field is present", async () => {
    const request = buildRequest({
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_IMAGE");
  });

  it("returns UNSUPPORTED_FORMAT (400) for a file with no recognizable image signature", async () => {
    const request = buildRequest({
      image: new Blob([new Uint8Array(32).fill(0x41)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("UNSUPPORTED_FORMAT");
  });

  it("returns INVALID_OPERATION (400) for an unknown operation id", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "not-a-real-operation",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_OPERATION");
  });

  it("returns INVALID_SELECTION (400) for a malformed region", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: { x: 0.1 },
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_SELECTION");
  });

  it("returns PROVIDER_UNAVAILABLE (503) when the resolved provider reports itself unconfigured", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeUnconfiguredProvider(),
    });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("returns PROCESSING_FAILED (502) when the provider throws during processing", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeFailureProvider(),
    });
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("PROCESSING_FAILED");
  });

  it("returns RESULT_INVALID (502) when the provider's result has no bytes/dimensions", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeInvalidResultProvider(),
    });
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("RESULT_INVALID");
  });

  it("returns TIMEOUT (504) when the provider exceeds the configured timeout", async () => {
    vi.stubEnv("CLOUD_CLEANUP_TIMEOUT_MS", "10");
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSlowProvider(),
    });
    expect(response.status).toBe(504);
    expect((await response.json()).error.code).toBe("TIMEOUT");
  });

  it("returns 200 with the processed image bytes and metadata headers on success", async () => {
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("X-ClearImage-Width")).toBe("100");
    expect(response.headers.get("X-ClearImage-Height")).toBe("100");
    expect(response.headers.get("X-ClearImage-Total-Ms")).toBeTruthy();

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.byteLength).toBe(REAL_PNG.byteLength);
  });

  it("never logs raw image bytes on a provider failure", async () => {
    const errorSpy = vi.spyOn(console, "error");
    const request = buildRequest({
      image: new Blob([REAL_PNG], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
    });
    await handleCleanupProcessRequest(request, {
      provider: new FakeFailureProvider(),
    });

    expect(errorSpy).toHaveBeenCalled();
    for (const call of errorSpy.mock.calls) {
      const serialized = JSON.stringify(call);
      // The real PNG fixture bytes, base64-encoded, would appear as a long
      // recognizable substring if the handler ever logged them directly.
      expect(serialized).not.toContain(
        Buffer.from(REAL_PNG).toString("base64"),
      );
    }
  });
});

describe("request size guard", () => {
  // A small, real, valid PNG signature + IHDR header so any request built
  // here that *does* reach validateCloudRequest passes the format/signature
  // check — only its size is under test in this block. Padded with trailing
  // bytes to reach whatever size each test needs; the dimension parser only
  // reads the leading IHDR bytes, so padding after it is harmless.
  const PNG_HEADER = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // length + "IHDR"
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // width=1, height=1
  ]);

  function pngOfSize(totalBytes: number): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(totalBytes);
    bytes.set(PNG_HEADER);
    return bytes;
  }

  beforeEach(() => {
    // This describe block is a sibling of "POST /api/cleanup/process"
    // above, not nested inside it, so it does not inherit that block's own
    // beforeEach/afterEach — every env stub this block needs is set here.
    vi.stubEnv("CLOUD_CLEANUP_ENABLED", "true");
    // A small, fast-to-allocate limit for this block's own tests — the
    // guard's logic is size-relative, not tied to the real 8MB default
    // (that default is verified separately below).
    vi.stubEnv("CLOUD_CLEANUP_MAX_REQUEST_MB", "1");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const ONE_MB = 1024 * 1024;

  it("accepts a request comfortably under the configured limit", async () => {
    const size = 100 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(formDataSpy).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("accepts a request exactly at the configured limit", async () => {
    const request = buildRequest({
      image: new Blob([pngOfSize(ONE_MB)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: ONE_MB,
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(formDataSpy).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("rejects a request clearly above the configured limit as FILE_TOO_LARGE (400)", async () => {
    const size = ONE_MB + 200 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("FILE_TOO_LARGE");
  });

  it("rejects an oversized request before the body is ever read (formData is never called)", async () => {
    const size = ONE_MB + 200 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });
    const formDataSpy = vi.spyOn(request, "formData");
    const provider = new FakeSuccessProvider();
    const processSpy = vi.spyOn(provider, "process");

    await handleCleanupProcessRequest(request, { provider });

    expect(formDataSpy).not.toHaveBeenCalled();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it("still rejects a too-large image that slips past the early Content-Length check (within the overhead allowance) via the exact byte check", async () => {
    // Just over the 1MB limit, but within the 16KB Content-Length overhead
    // allowance — the early header check lets it through, so this proves
    // the later exact check (validateCloudRequest) still catches it. The
    // two layers are complementary, not redundant.
    const size = ONE_MB + 4 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(formDataSpy).toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("FILE_TOO_LARGE");
  });

  it("rejects with PROVIDER_UNAVAILABLE, not FILE_TOO_LARGE, when cloud cleanup is disabled — even for an oversized request", async () => {
    vi.stubEnv("CLOUD_CLEANUP_ENABLED", "false");
    const size = ONE_MB + 200 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(formDataSpy).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("still enforces the real 8MB default when no override is set", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("CLOUD_CLEANUP_ENABLED", "true");
    const EIGHT_MB = 8 * 1024 * 1024;
    const size = EIGHT_MB + 500 * 1024;
    const request = buildRequest({
      image: new Blob([pngOfSize(size)], { type: "image/png" }),
      operationId: "remove-watermark",
      region: VALID_REGION,
      contentLength: size,
    });
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await handleCleanupProcessRequest(request, {
      provider: new FakeSuccessProvider(),
    });

    expect(formDataSpy).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("FILE_TOO_LARGE");
  });
});
