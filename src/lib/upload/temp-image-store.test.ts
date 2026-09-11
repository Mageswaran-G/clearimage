import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as TempImageStoreModule from "@/lib/upload/temp-image-store";

function makeRecord(previewUrl: string) {
  return {
    file: new File([new Uint8Array(1)], "photo.jpg", { type: "image/jpeg" }),
    previewUrl,
    dimensions: { width: 800, height: 600 },
  };
}

describe("temp-image-store", () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let createTempImageId: typeof TempImageStoreModule.createTempImageId;
  let deleteTempImage: typeof TempImageStoreModule.deleteTempImage;
  let getTempImage: typeof TempImageStoreModule.getTempImage;
  let saveTempImage: typeof TempImageStoreModule.saveTempImage;

  // The store keeps module-level state (the map, plus the "current active
  // id"). Re-importing fresh for every test — rather than reusing one
  // shared import — keeps each test's expectations isolated, the same way
  // a real page load always starts from an empty store.
  beforeEach(async () => {
    // Import BEFORE stubbing URL: dynamic import() itself relies on the
    // real URL constructor to resolve the module specifier, so stubbing
    // first breaks module loading rather than the code under test.
    vi.resetModules();
    ({ createTempImageId, deleteTempImage, getTempImage, saveTempImage } =
      await import("@/lib/upload/temp-image-store"));

    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates unique ids", () => {
    const a = createTempImageId();
    const b = createTempImageId();
    expect(a).not.toBe(b);
  });

  it("saves and retrieves a record by id", () => {
    const id = createTempImageId();
    saveTempImage(id, makeRecord("blob:one"));
    expect(getTempImage(id)?.previewUrl).toBe("blob:one");
  });

  it("returns undefined for an id that was never saved", () => {
    expect(getTempImage(createTempImageId())).toBeUndefined();
  });

  it("deleteTempImage revokes the object URL and removes the record", () => {
    const id = createTempImageId();
    saveTempImage(id, makeRecord("blob:to-delete"));

    deleteTempImage(id);

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:to-delete");
    expect(getTempImage(id)).toBeUndefined();
  });

  it("deleteTempImage on an unknown id is a safe no-op", () => {
    expect(() => deleteTempImage(createTempImageId())).not.toThrow();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("saving a new record automatically cleans up the previous active record", () => {
    const firstId = createTempImageId();
    saveTempImage(firstId, makeRecord("blob:first"));

    const secondId = createTempImageId();
    saveTempImage(secondId, makeRecord("blob:second"));

    // The old (replaced) record is gone and its object URL was revoked...
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(getTempImage(firstId)).toBeUndefined();
    // ...while the new record survives untouched.
    expect(getTempImage(secondId)?.previewUrl).toBe("blob:second");
    expect(revokeObjectURL).not.toHaveBeenCalledWith("blob:second");
  });

  it("does not revoke a record while it is still the active one (Inspect/Provenance/Cleanup navigation)", () => {
    const id = createTempImageId();
    saveTempImage(id, makeRecord("blob:active"));

    // Simulate reading the same record again from a later workflow step,
    // the way Inspect and then Provenance both do via the same route id.
    getTempImage(id);
    getTempImage(id);

    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(getTempImage(id)?.previewUrl).toBe("blob:active");
  });

  it("re-saving under the same id does not revoke its own object URL", () => {
    const id = createTempImageId();
    saveTempImage(id, makeRecord("blob:same"));
    saveTempImage(id, makeRecord("blob:same"));

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});
