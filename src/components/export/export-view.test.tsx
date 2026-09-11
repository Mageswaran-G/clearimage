import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExportView } from "@/components/export/export-view";
import {
  createTempImageId,
  getTempImage,
  saveTempImage,
} from "@/lib/upload/temp-image-store";
import { saveCleanupResult } from "@/lib/cleanup/cleanup-result-store";

function saveSourceRecord(fileName = "vacation.jpg") {
  const id = createTempImageId();
  const file = new File([new Uint8Array(4)], fileName, { type: "image/jpeg" });
  saveTempImage(id, {
    file,
    previewUrl: "blob:source",
    dimensions: { width: 400, height: 300 },
  });
  return id;
}

function saveResult(
  id: string,
  overrides: Partial<{ blob: Blob; url: string }> = {},
) {
  saveCleanupResult(id, {
    blob: overrides.blob ?? new Blob(["fake-bytes"], { type: "image/png" }),
    url: overrides.url ?? "blob:result",
    width: 400,
    height: 300,
    operationId: "blur-region",
  });
}

describe("ExportView", () => {
  // Add revokeObjectURL as a static method on the real URL constructor,
  // rather than replacing the global with a plain object (vi.stubGlobal) —
  // next/image's <Image> (used by ImageFrame) calls `new URL(...)` during
  // render, so URL must stay a real constructor throughout these tests.
  beforeEach(() => {
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("shows 'No image found' when the source doesn't exist", () => {
    render(<ExportView id={createTempImageId()} />);
    expect(
      screen.getByRole("heading", { name: "No image found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Upload an image" }),
    ).toHaveAttribute("href", "/upload");
  });

  it("shows a distinct 'Nothing to export yet' state when the source exists but Cleanup hasn't produced a result", () => {
    const id = saveSourceRecord();
    render(<ExportView id={id} />);

    expect(
      screen.getByRole("heading", { name: "Nothing to export yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Cleanup" })).toHaveAttribute(
      "href",
      `/cleanup/${id}`,
    );
  });

  it("renders the processed image, real metadata, and a real download action", () => {
    const id = saveSourceRecord("vacation.jpg");
    saveResult(id, { blob: new Blob(["fake-bytes"], { type: "image/png" }) });

    render(<ExportView id={id} />);

    expect(
      screen.getByRole("heading", { name: "Your image is ready" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText(/vacation.jpg/)).toHaveAttribute(
      "src",
      "blob:result",
    );
    expect(screen.getByText("PNG")).toBeInTheDocument();
    expect(screen.getByText("400 × 300")).toBeInTheDocument();

    const downloadLink = screen.getByRole("link", { name: "Download Image" });
    expect(downloadLink).toHaveAttribute("href", "blob:result");
    expect(downloadLink).toHaveAttribute("download", "vacation-cleaned.png");
  });

  it("shows a completion confirmation only after the user actually clicks download", () => {
    const id = saveSourceRecord();
    saveResult(id);
    render(<ExportView id={id} />);

    expect(screen.getByRole("status")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("link", { name: "Download Image" }));

    expect(screen.getByRole("status")).toHaveTextContent(/download started/i);
    // Download remains usable again — clicking doesn't disable or remove it.
    expect(
      screen.getByRole("link", { name: "Download Image" }),
    ).toBeInTheDocument();
  });

  it("never displays or exports the original source when a processed result exists", () => {
    const id = saveSourceRecord();
    saveResult(id, { url: "blob:processed-result" });

    render(<ExportView id={id} />);

    const downloadLink = screen.getByRole("link", { name: "Download Image" });
    expect(downloadLink).toHaveAttribute("href", "blob:processed-result");
    expect(downloadLink).not.toHaveAttribute("href", "blob:source");
    expect(screen.getByAltText(/Cleaned result/)).toHaveAttribute(
      "src",
      "blob:processed-result",
    );
  });

  it("Process Another Image clears the temp record for this id (workflow-end cleanup)", () => {
    const id = saveSourceRecord();
    saveResult(id);
    render(<ExportView id={id} />);

    fireEvent.click(
      screen.getByRole("link", { name: "Process Another Image" }),
    );

    expect(getTempImage(id)).toBeUndefined();
  });

  it("treats an empty processed blob as a real export error, not a downloadable result", () => {
    const id = saveSourceRecord();
    saveResult(id, { blob: new Blob([], { type: "image/png" }) });

    render(<ExportView id={id} />);

    expect(
      screen.getByRole("heading", { name: "Export unavailable" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Download Image" }),
    ).not.toBeInTheDocument();
  });
});
