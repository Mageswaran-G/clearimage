import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as CleanupResultStoreModule from "@/lib/cleanup/cleanup-result-store";

function makeRecord(url: string) {
  return {
    blob: new Blob(["fake-bytes"], { type: "image/png" }),
    url,
    width: 400,
    height: 300,
    operationId: "blur-region" as const,
  };
}

describe("cleanup-result-store", () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let saveCleanupResult: typeof CleanupResultStoreModule.saveCleanupResult;
  let getCleanupResult: typeof CleanupResultStoreModule.getCleanupResult;
  let deleteCleanupResult: typeof CleanupResultStoreModule.deleteCleanupResult;

  // Import BEFORE stubbing URL: dynamic import() relies on the real URL
  // constructor to resolve the module specifier (see temp-image-store's
  // test for the same reasoning).
  beforeEach(async () => {
    vi.resetModules();
    ({ saveCleanupResult, getCleanupResult, deleteCleanupResult } =
      await import("@/lib/cleanup/cleanup-result-store"));

    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and retrieves a result by id", () => {
    saveCleanupResult("id-1", makeRecord("blob:one"));
    expect(getCleanupResult("id-1")?.url).toBe("blob:one");
  });

  it("returns undefined for an id with no saved result", () => {
    expect(getCleanupResult("unknown")).toBeUndefined();
  });

  it("deleteCleanupResult revokes the object URL and removes the record", () => {
    saveCleanupResult("id-1", makeRecord("blob:one"));
    deleteCleanupResult("id-1");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
    expect(getCleanupResult("id-1")).toBeUndefined();
  });

  it("deleteCleanupResult on an unknown id is a safe no-op", () => {
    expect(() => deleteCleanupResult("unknown")).not.toThrow();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("saving a new result for the same id revokes the previous one (Re-run Cleanup)", () => {
    saveCleanupResult("id-1", makeRecord("blob:first-run"));
    saveCleanupResult("id-1", makeRecord("blob:second-run"));

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first-run");
    expect(revokeObjectURL).not.toHaveBeenCalledWith("blob:second-run");
    expect(getCleanupResult("id-1")?.url).toBe("blob:second-run");
  });

  it("keeps results for different ids fully independent", () => {
    saveCleanupResult("id-1", makeRecord("blob:one"));
    saveCleanupResult("id-2", makeRecord("blob:two"));

    deleteCleanupResult("id-1");

    expect(getCleanupResult("id-1")).toBeUndefined();
    expect(getCleanupResult("id-2")?.url).toBe("blob:two");
  });
});
