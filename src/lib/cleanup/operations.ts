import type { CleanupOperation } from "@/lib/cleanup/types";

/**
 * The full Cleanup operation catalog. Only "blur-region" and "crop-region"
 * are wired to real processing (see canvas-processor.ts) — both are plain,
 * genuine pixel operations a browser Canvas can actually perform. The rest
 * describe content-aware removal, which needs a real inpainting/ML engine
 * this project doesn't have; they're listed and disabled rather than
 * hidden, so the UI states the real feature set honestly instead of
 * silently pretending they don't exist or faking a result for them.
 */
export const CLEANUP_OPERATIONS: CleanupOperation[] = [
  {
    id: "blur-region",
    label: "Blur selected area",
    description:
      "Applies a real blur to the area you select, obscuring it without changing the image size.",
    available: true,
  },
  {
    id: "crop-region",
    label: "Crop to selection",
    description:
      "Crops the image down to only the area you select, discarding everything outside it.",
    available: true,
  },
  {
    id: "remove-watermark",
    label: "Remove watermark",
    description: "Content-aware watermark removal is not available yet.",
    available: false,
  },
  {
    id: "remove-text-overlay",
    label: "Remove text overlay",
    description: "Content-aware text removal is not available yet.",
    available: false,
  },
  {
    id: "remove-logo",
    label: "Remove logo / stamp",
    description: "Content-aware logo removal is not available yet.",
    available: false,
  },
  {
    id: "reduce-artifacts",
    label: "Reduce artifacts",
    description: "Automatic artifact reduction is not available yet.",
    available: false,
  },
];

export const DEFAULT_CLEANUP_OPERATION_ID = "blur-region";
