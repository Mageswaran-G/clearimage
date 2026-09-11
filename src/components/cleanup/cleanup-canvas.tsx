/* eslint-disable @next/next/no-img-element -- object-URL previews (original + processed), not static/remote assets */
"use client";

import { useRef, useState } from "react";
import { clamp01, isValidRegion, regionFromPoints } from "@/lib/cleanup/region";
import type {
  CleanupRegion,
  CleanupResult,
  CleanupState,
} from "@/lib/cleanup/types";

interface CleanupCanvasProps {
  previewUrl: string;
  altText: string;
  sourceDimensions: { width: number; height: number };
  zoom: number;
  region: CleanupRegion | null;
  onRegionChange: (region: CleanupRegion) => void;
  state: CleanupState;
  result: CleanupResult | null;
  sliderPos: number;
  onSliderPosChange: (pos: number) => void;
  className?: string;
}

/**
 * The interactive image stage: shows the source image, lets the user drag a
 * rectangular cleanup region over it, and — once a real result exists —
 * shows either a genuine original/cleaned comparison slider (when the
 * result is the same size as the source, i.e. a blur) or the real result on
 * its own (when it isn't, i.e. a crop, where overlaying two different-sized
 * images wouldn't be a meaningful comparison).
 */
export function CleanupCanvas({
  previewUrl,
  altText,
  sourceDimensions,
  zoom,
  region,
  onRegionChange,
  state,
  result,
  sliderPos,
  onSliderPosChange,
  className = "",
}: CleanupCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [draftRegion, setDraftRegion] = useState<CleanupRegion | null>(null);
  const [sliderDragging, setSliderDragging] = useState(false);

  const comparableResult =
    result &&
    result.width === sourceDimensions.width &&
    result.height === sourceDimensions.height
      ? result
      : null;
  const resultOnly = result && !comparableResult ? result : null;

  function pointToNormalized(e: { clientX: number; clientY: number }) {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (state === "processing") return;
    const p = pointToNormalized(e);
    setDragStart(p);
    setDraftRegion({ x: p.x, y: p.y, width: 0, height: 0 });
    stageRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const p = pointToNormalized(e);
    setDraftRegion(regionFromPoints(dragStart.x, dragStart.y, p.x, p.y));
  }

  function handlePointerUp() {
    if (!dragStart) return;
    setDragStart(null);
    // Only a genuinely valid drag replaces the committed region — a stray
    // click or too-small drag just cancels itself, leaving any previously
    // selected region (and its result) untouched.
    if (draftRegion && isValidRegion(draftRegion)) {
      onRegionChange(draftRegion);
    }
    setDraftRegion(null);
  }

  function handleSliderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSliderDragging(true);
  }

  function handleSliderPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!sliderDragging) return;
    onSliderPosChange(pointToNormalized(e).x * 100);
  }

  const displayRegion = draftRegion ?? region;

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative min-h-[320px] flex-1 touch-none overflow-hidden rounded-lg bg-workspace-dark select-none ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        {resultOnly ? (
          <img
            src={resultOnly.url}
            alt={`Cleaned result: ${altText}`}
            draggable={false}
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <img
              src={comparableResult ? comparableResult.url : previewUrl}
              alt={comparableResult ? `Cleaned: ${altText}` : altText}
              draggable={false}
              className="h-full w-full object-contain"
            />
            {comparableResult && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={previewUrl}
                  alt={`Original: ${altText}`}
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </>
        )}
      </div>

      {!result && displayRegion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute border-2 border-teal bg-teal/10"
          style={{
            left: `${displayRegion.x * 100}%`,
            top: `${displayRegion.y * 100}%`,
            width: `${displayRegion.width * 100}%`,
            height: `${displayRegion.height * 100}%`,
          }}
        />
      )}

      {comparableResult && (
        <div
          role="slider"
          aria-label="Compare original and cleaned image"
          aria-valuenow={Math.round(sliderPos)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onPointerDown={handleSliderPointerDown}
          onPointerMove={handleSliderPointerMove}
          onPointerUp={() => setSliderDragging(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft")
              onSliderPosChange(clamp01((sliderPos - 5) / 100) * 100);
            if (e.key === "ArrowRight")
              onSliderPosChange(clamp01((sliderPos + 5) / 100) * 100);
          }}
          className="absolute top-0 bottom-0 w-6 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white" />
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-bold text-teal">
            ⟷
          </div>
        </div>
      )}

      {comparableResult && (
        <>
          <div className="pointer-events-none absolute top-3.5 left-3.5 rounded bg-[#101116]/70 px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-text-secondary">
            ORIGINAL
          </div>
          <div className="pointer-events-none absolute top-3.5 right-3.5 rounded bg-[#101116]/70 px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-text-secondary">
            CLEANED
          </div>
        </>
      )}

      {resultOnly && (
        <div className="pointer-events-none absolute top-3.5 left-3.5 rounded bg-[#101116]/70 px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-teal">
          CROPPED RESULT — {resultOnly.width} × {resultOnly.height}
        </div>
      )}

      {state === "processing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-[#0B1114]/85">
          <div
            aria-hidden="true"
            className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-[#22232A] border-t-teal"
          />
          <div className="font-mono text-xs text-[#C7C8CC]">PROCESSING…</div>
        </div>
      )}
    </div>
  );
}
