import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CleanupView } from "@/components/cleanup/cleanup-view";
import {
  createTempImageId,
  saveTempImage,
} from "@/lib/upload/temp-image-store";

/** Same pattern used across the codebase's other tests: a controllable
 * stand-in for the browser's Image element (see validate-image.test.ts). */
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  #src = "";

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => {
      this.naturalWidth = 400;
      this.naturalHeight = 300;
      this.onload?.();
    });
  }

  get src() {
    return this.#src;
  }
}

/** Same recording-stub approach as canvas-processor.test.ts: jsdom creates
 * real <canvas> elements but has no 2D rendering engine, so we stand in for
 * just enough of CanvasRenderingContext2D to let real processing logic run. */
class FakeContext2D {
  filter = "none";
  drawImage() {}
  save() {}
  restore() {}
  beginPath() {}
  rect() {}
  clip() {}
}

let toBlobShouldFail = false;

function stubCanvasAndImage() {
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => new FakeContext2D() as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    callback: BlobCallback,
  ) {
    queueMicrotask(() => {
      callback(toBlobShouldFail ? null : new Blob(["fake-bytes"]));
    });
  });
}

function saveRecord(fileName = "photo.jpg") {
  const id = createTempImageId();
  const file = new File([new Uint8Array(4)], fileName, {
    type: "image/jpeg",
  });
  saveTempImage(id, {
    file,
    previewUrl: "blob:source",
    dimensions: { width: 400, height: 300 },
  });
  return id;
}

describe("CleanupView", () => {
  beforeEach(() => {
    toBlobShouldFail = false;
    stubCanvasAndImage();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:result"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a 'No image found' state for a missing image id", () => {
    render(<CleanupView id={createTempImageId()} />);
    expect(
      screen.getByRole("heading", { name: "No image found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Upload an image" }),
    ).toHaveAttribute("href", "/upload");
  });

  it("loads a valid image with Process disabled until a region is selected", () => {
    const id = saveRecord();
    render(<CleanupView id={id} />);

    expect(screen.getByAltText("photo.jpg")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Process Image" }),
    ).toBeDisabled();
  });

  it("selecting the whole image enables Process (real, keyboard-accessible region selection)", async () => {
    const id = saveRecord();
    render(<CleanupView id={id} />);

    fireEvent.click(screen.getByRole("button", { name: "Select whole image" }));

    expect(screen.getByRole("button", { name: "Process Image" })).toBeEnabled();
  });

  it("Reset selection clears the region and disables Process again", async () => {
    const id = saveRecord();
    render(<CleanupView id={id} />);

    fireEvent.click(screen.getByRole("button", { name: "Select whole image" }));
    expect(screen.getByRole("button", { name: "Process Image" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Reset selection" }));

    expect(
      screen.getByRole("button", { name: "Process Image" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Reset selection" }),
    ).not.toBeInTheDocument();
  });

  it("processes successfully: shows Re-run Cleanup, Download Result, Continue to Export, and a real before/after comparison", async () => {
    const id = saveRecord();
    render(<CleanupView id={id} />);

    fireEvent.click(screen.getByRole("button", { name: "Select whole image" }));
    fireEvent.click(screen.getByRole("button", { name: "Process Image" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Re-run Cleanup" }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText("ORIGINAL")).toBeInTheDocument();
    expect(screen.getByText("CLEANED")).toBeInTheDocument();
    expect(
      screen.getByRole("slider", {
        name: "Compare original and cleaned image",
      }),
    ).toBeInTheDocument();

    const downloadLink = screen.getByRole("link", { name: "Download Result" });
    expect(downloadLink).toHaveAttribute("href", "blob:result");

    expect(
      screen.getByRole("link", { name: "Continue to Export" }),
    ).toHaveAttribute("href", `/export/${id}`);
  });

  it("surfaces a real processing failure as an error, without claiming a result", async () => {
    toBlobShouldFail = true;
    const id = saveRecord();
    render(<CleanupView id={id} />);

    fireEvent.click(screen.getByRole("button", { name: "Select whole image" }));
    fireEvent.click(screen.getByRole("button", { name: "Process Image" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/could not encode/i)).toBeInTheDocument();

    // No fabricated success: no comparison labels, Process still says "Process Image".
    expect(screen.queryByText("CLEANED")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Process Image" }),
    ).toBeInTheDocument();
  });
});
