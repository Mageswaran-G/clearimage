import { describe, expect, it } from "vitest";
import {
  buildExportFilename,
  extensionForMimeType,
} from "@/lib/export/filename";

describe("extensionForMimeType", () => {
  it("maps each supported output format to its real extension", () => {
    expect(extensionForMimeType("image/png")).toBe(".png");
    expect(extensionForMimeType("image/jpeg")).toBe(".jpg");
    expect(extensionForMimeType("image/webp")).toBe(".webp");
  });

  it("falls back to .png for an unrecognized type", () => {
    expect(extensionForMimeType("application/octet-stream")).toBe(".png");
  });
});

describe("buildExportFilename", () => {
  it("builds a normal filename", () => {
    expect(buildExportFilename("my-photo.png", "image/png")).toBe(
      "my-photo-cleaned.png",
    );
  });

  it("handles a filename with multiple dots, stripping only the real extension", () => {
    expect(buildExportFilename("my.photo.final.png", "image/png")).toBe(
      "my.photo.final-cleaned.png",
    );
  });

  it("strips Unix path separators, never exposing a path", () => {
    expect(buildExportFilename("../../etc/passwd.jpg", "image/jpeg")).toBe(
      "passwd-cleaned.jpg",
    );
  });

  it("strips Windows path separators, never exposing a path", () => {
    expect(
      buildExportFilename("C:\\Users\\name\\photo.jpg", "image/jpeg"),
    ).toBe("photo-cleaned.jpg");
  });

  it("handles a filename with no extension at all", () => {
    expect(buildExportFilename("photo", "image/png")).toBe("photo-cleaned.png");
  });

  it("preserves an unusual Unicode filename", () => {
    expect(buildExportFilename("写真.png", "image/png")).toBe(
      "写真-cleaned.png",
    );
  });

  it("uses the real output extension, not the original file's extension", () => {
    // Cleanup preserves format, but this proves the naming itself trusts
    // the actual output MIME type rather than assuming from the input name.
    expect(buildExportFilename("photo.png", "image/jpeg")).toBe(
      "photo-cleaned.jpg",
    );
  });

  it("falls back to a safe base name for a pathological/empty result", () => {
    expect(buildExportFilename("...", "image/png")).toBe("image-cleaned.png");
  });
});
