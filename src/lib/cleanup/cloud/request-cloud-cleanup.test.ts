// @vitest-environment node
//
// This module's DOM dependencies (Image, URL.createObjectURL/revokeObjectURL)
// are fully stubbed below rather than exercised for real, but the tests also
// construct real Fetch API Response objects with Blob bodies. jsdom's Blob
// isn't interoperable with Node's native (undici) Response/fetch — the same
// cross-realm issue documented in route.test.ts, here surfacing as
// "object.stream is not a function" — so this file runs under Node's
// environment to keep every Fetch API object in one consistent realm.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  requestCloudCleanup,
  validateCloudCleanupResult,
} from "@/lib/cleanup/cloud/request-cloud-cleanup";

const VALID_REGION = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 };

/** Same FakeImage shape already established in canvas-processor.test.ts —
 * jsdom creates real <img> elements but doesn't decode real image bytes,
 * so decode success/failure is driven by a sentinel src value. */
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  #src = "";

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => {
      if (value === "blob:undecodable") {
        this.onerror?.();
        return;
      }
      this.naturalWidth = 64;
      this.naturalHeight = 48;
      this.onload?.();
    });
  }
  get src() {
    return this.#src;
  }
}

function makeFile(): File {
  return new File([new Uint8Array([1, 2, 3])], "source.png", {
    type: "image/png",
  });
}

describe("validateCloudCleanupResult", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:result"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the decoded result for a valid, non-empty blob", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    const result = await validateCloudCleanupResult(blob, 64, 48);
    expect(result.width).toBe(64);
    expect(result.height).toBe(48);
    expect(result.url).toBe("blob:result");
  });

  it("rejects with RESULT_INVALID for an empty blob", async () => {
    const blob = new Blob([], { type: "image/png" });
    await expect(
      validateCloudCleanupResult(blob, 64, 48),
    ).rejects.toMatchObject({
      code: "RESULT_INVALID",
    });
  });

  it("rejects with RESULT_INVALID when the declared dimensions are non-positive", async () => {
    const blob = new Blob([new Uint8Array([1])], { type: "image/png" });
    await expect(validateCloudCleanupResult(blob, 0, 48)).rejects.toMatchObject(
      {
        code: "RESULT_INVALID",
      },
    );
  });

  it("rejects with RESULT_INVALID when the blob can't actually be decoded as an image", async () => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:undecodable"),
      revokeObjectURL: vi.fn(),
    });
    const blob = new Blob([new Uint8Array([1])], { type: "image/png" });
    await expect(
      validateCloudCleanupResult(blob, 64, 48),
    ).rejects.toMatchObject({
      code: "RESULT_INVALID",
    });
  });
});

describe("requestCloudCleanup", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:result"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts the file/operation/region and returns a validated result on success", async () => {
    const resultBlob = new Blob([new Uint8Array([9, 9, 9])], {
      type: "image/png",
    });
    const fetchMock = vi.fn<
      (url: string, init: RequestInit) => Promise<Response>
    >(
      async () =>
        new Response(resultBlob, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "X-ClearImage-Width": "64",
            "X-ClearImage-Height": "48",
          },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestCloudCleanup(
      makeFile(),
      VALID_REGION,
      "remove-watermark",
    );
    expect(result.width).toBe(64);
    expect(result.height).toBe(48);

    // Assert on the recorded call args after the fact, rather than
    // asserting from inside the mock — a failed assertion in there would
    // throw, and requestCloudCleanup's own catch block would mask it as a
    // generic connectivity failure instead of surfacing the real mismatch.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/cleanup/process");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("operationId")).toBe("remove-watermark");
    expect(JSON.parse(body.get("region") as string)).toEqual(VALID_REGION);
  });

  it("throws CloudCleanupError with the server's code on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: "PROVIDER_UNAVAILABLE" } }),
            {
              status: 503,
            },
          ),
      ),
    );

    await expect(
      requestCloudCleanup(makeFile(), VALID_REGION, "remove-watermark"),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("falls back to PROCESSING_FAILED when the error response body isn't the expected shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 500 })),
    );

    await expect(
      requestCloudCleanup(makeFile(), VALID_REGION, "remove-watermark"),
    ).rejects.toMatchObject({ code: "PROCESSING_FAILED" });
  });

  it("wraps a network failure as PROCESSING_FAILED", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );

    await expect(
      requestCloudCleanup(makeFile(), VALID_REGION, "remove-watermark"),
    ).rejects.toMatchObject({ code: "PROCESSING_FAILED" });
  });

  it("re-throws an AbortError as-is rather than masking it as PROCESSING_FAILED", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );

    await expect(
      requestCloudCleanup(makeFile(), VALID_REGION, "remove-watermark"),
    ).rejects.toThrow("aborted");
  });

  it("rejects a successful-status response whose result fails validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Blob([], { type: "image/png" }), {
            status: 200,
            headers: {
              "X-ClearImage-Width": "64",
              "X-ClearImage-Height": "48",
            },
          }),
      ),
    );

    await expect(
      requestCloudCleanup(makeFile(), VALID_REGION, "remove-watermark"),
    ).rejects.toMatchObject({ code: "RESULT_INVALID" });
  });
});
