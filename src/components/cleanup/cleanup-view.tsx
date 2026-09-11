"use client";

import { useState, useSyncExternalStore } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { CleanupCanvas } from "@/components/cleanup/cleanup-canvas";
import { OperationList } from "@/components/cleanup/operation-list";
import { ZoomControls } from "@/components/cleanup/zoom-controls";
import {
  getTempImage,
  type TempImageRecord,
} from "@/lib/upload/temp-image-store";
import {
  CLEANUP_OPERATIONS,
  DEFAULT_CLEANUP_OPERATION_ID,
} from "@/lib/cleanup/operations";
import {
  loadImageElement,
  runCleanupOperation,
} from "@/lib/cleanup/canvas-processor";
import type {
  CleanupOperationId,
  CleanupRegion,
  CleanupResult,
  CleanupState,
} from "@/lib/cleanup/types";
import { CleanupProcessingError } from "@/lib/cleanup/types";

interface CleanupViewProps {
  id: string;
}

const WHOLE_IMAGE_REGION: CleanupRegion = { x: 0, y: 0, width: 1, height: 1 };
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;
const MIN_BLUR = 4;
const MAX_BLUR = 40;

const noSubscription = () => () => {};

export function CleanupView({ id }: CleanupViewProps) {
  const record: TempImageRecord | null = useSyncExternalStore(
    noSubscription,
    () => getTempImage(id) ?? null,
    () => null,
  );

  const [region, setRegion] = useState<CleanupRegion | null>(null);
  const [selectedOperationId, setSelectedOperationId] =
    useState<CleanupOperationId>(DEFAULT_CLEANUP_OPERATION_ID);
  const [blurStrength, setBlurStrength] = useState(16);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [phase, setPhase] = useState<"processing" | "success" | "error" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (record === null) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center px-[18px] py-16 text-center md:px-8">
        <h1 className="mb-2 font-display text-2xl font-extrabold text-white">
          No image found
        </h1>
        <p className="mb-6 text-[#8B959A]">
          This session doesn&apos;t have an uploaded image to clean up. Upload
          an image to begin.
        </p>
        <PrimaryButton href="/upload">Upload an image</PrimaryButton>
      </div>
    );
  }

  const cleanupState: CleanupState = phase ?? (region ? "ready" : "loaded");

  function replaceResult(next: CleanupResult | null) {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return next;
    });
  }

  function handleRegionChange(next: CleanupRegion) {
    setRegion(next);
    replaceResult(null);
    setPhase(null);
    setErrorMessage(null);
  }

  function handleWorkflowReset() {
    setRegion(null);
    replaceResult(null);
    setPhase(null);
    setErrorMessage(null);
  }

  async function handleProcess() {
    if (!record || !region) return;
    setPhase("processing");
    setErrorMessage(null);
    try {
      const image = await loadImageElement(record.previewUrl);
      const nextResult = await runCleanupOperation(
        image,
        region,
        selectedOperationId,
        { blurStrength },
      );
      replaceResult(nextResult);
      setSliderPos(50);
      setPhase("success");
    } catch (err) {
      setErrorMessage(
        err instanceof CleanupProcessingError
          ? err.message
          : "Something went wrong while processing this image. Please try again.",
      );
      setPhase("error");
    }
  }

  const canProcess = region !== null && cleanupState !== "processing";
  const processLabel =
    cleanupState === "processing"
      ? "Processing…"
      : phase === "success"
        ? "Re-run Cleanup"
        : "Process Image";

  const downloadName = record.file.name.replace(/(\.[^.]+)?$/, (ext) =>
    ext ? `-cleaned${ext}` : "-cleaned",
  );

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-[#1E1F26] p-[18px] md:w-[260px] md:border-r md:border-b-0 md:p-7">
        <div>
          <div className="mb-3.5 font-mono text-[11px] tracking-wide text-[#4F5A5D]">
            CLEANUP
          </div>
          <OperationList
            operations={CLEANUP_OPERATIONS}
            selectedId={selectedOperationId}
            onSelect={setSelectedOperationId}
            disabled={cleanupState === "processing"}
          />
          <button
            type="button"
            onClick={() => handleRegionChange(WHOLE_IMAGE_REGION)}
            disabled={cleanupState === "processing"}
            className="mt-2.5 text-[12.5px] font-semibold text-teal hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            Select whole image
          </button>
        </div>

        <div className="border-t border-[#1E1F26] pt-4.5">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex items-center gap-1.5 font-sans text-xs font-semibold text-[#657074]"
          >
            Advanced{" "}
            <span className="font-mono">{advancedOpen ? "−" : "+"}</span>
          </button>
          {advancedOpen && selectedOperationId === "blur-region" && (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-[#657074]">
                <span>Blur strength</span>
                <span className="font-mono">{blurStrength}px</span>
              </div>
              <input
                type="range"
                min={MIN_BLUR}
                max={MAX_BLUR}
                value={blurStrength}
                onChange={(e) => setBlurStrength(Number(e.target.value))}
                aria-label="Blur strength"
                className="w-full accent-teal"
              />
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <PrimaryButton
            type="button"
            onClick={handleProcess}
            disabled={!canProcess}
            className="w-full py-3 text-sm"
          >
            {processLabel}
          </PrimaryButton>

          {(region !== null || result !== null) && (
            <SecondaryButton
              type="button"
              tone="dark"
              onClick={handleWorkflowReset}
              disabled={cleanupState === "processing"}
              className="w-full py-3 text-sm"
            >
              Reset selection
            </SecondaryButton>
          )}

          {result && (
            <>
              <a
                href={result.url}
                download={downloadName}
                className="w-full rounded-md border border-[#33343B] px-4 py-3 text-center text-sm font-bold text-[#F0F0F2] transition-colors hover:border-teal hover:text-teal"
              >
                Download Result
              </a>
              <PrimaryButton
                href={`/export/${id}`}
                className="w-full py-3 text-sm"
              >
                Continue to Export
              </PrimaryButton>
            </>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-end gap-1.5 border-b border-[#1E1F26] p-4">
          <ZoomControls
            onZoomIn={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            onZoomOut={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            onFit={() => setZoom(1)}
            onReset={() => {
              setZoom(1);
              setSliderPos(50);
            }}
          />
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-6">
          <CleanupCanvas
            previewUrl={record.previewUrl}
            altText={record.file.name}
            sourceDimensions={record.dimensions}
            zoom={zoom}
            region={region}
            onRegionChange={handleRegionChange}
            state={cleanupState}
            result={result}
            sliderPos={sliderPos}
            onSliderPosChange={setSliderPos}
          />
        </div>

        <div className="px-4 pb-5 font-mono text-xs text-[#4F5A5D] md:px-6">
          {result
            ? "Drag the divider to compare, or drag a new area to clean up something else."
            : "Drag on the image to select an area to clean up."}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mx-4 mb-5 rounded border-l-2 border-error bg-[#2A1717] px-4 py-3.5 md:mx-6"
          >
            <p className="text-[13.5px] leading-relaxed text-[#E8A9A9]">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
