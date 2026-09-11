import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploadFlow } from "@/components/upload/upload-flow";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  #src = "";

  set src(value: string) {
    this.#src = value;
    queueMicrotask(() => {
      this.naturalWidth = 1024;
      this.naturalHeight = 768;
      this.onload?.();
    });
  }

  get src() {
    return this.#src;
  }
}

const JPEG_HEADER = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

function makeFile(name: string, type: string): File {
  const bytes = type === "image/jpeg" ? JPEG_HEADER : new Uint8Array(4);
  return new File([bytes], name, { type });
}

describe("UploadFlow", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-preview"),
      revokeObjectURL: vi.fn(),
    });
    push.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // UploadPreview renders both a desktop and a mobile variant (toggled by
  // Tailwind's `md:` classes), and jsdom does not evaluate media queries, so
  // each piece of text/each button legitimately appears twice in these tests.

  it("shows the preview state with filename and metadata after a valid selection", async () => {
    render(<UploadFlow />);

    const input = screen.getByLabelText("Choose an image file");
    fireEvent.change(input, {
      target: { files: [makeFile("beach.jpg", "image/jpeg")] },
    });

    await waitFor(() =>
      expect(screen.getAllByText("beach.jpg").length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText("1024 × 768").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Analyze Image" }).length,
    ).toBeGreaterThan(0);
  });

  it("navigates to /inspect/[id] when Analyze Image is clicked", async () => {
    render(<UploadFlow />);

    const input = screen.getByLabelText("Choose an image file");
    fireEvent.change(input, {
      target: { files: [makeFile("beach.jpg", "image/jpeg")] },
    });
    await waitFor(() =>
      expect(screen.getAllByText("beach.jpg").length).toBeGreaterThan(0),
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Analyze Image" })[0],
    );

    expect(push).toHaveBeenCalledTimes(1);
    const destination = push.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/inspect\/[0-9a-f-]{36}$/i);
  });

  it("shows an inline error and stays idle for an unsupported file", async () => {
    render(<UploadFlow />);

    const input = screen.getByLabelText("Choose an image file");
    fireEvent.change(input, {
      target: { files: [makeFile("notes.txt", "text/plain")] },
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Unsupported format. Please upload a JPG, PNG, or WebP image.",
        ),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "Analyze Image" }),
    ).not.toBeInTheDocument();
  });
});
