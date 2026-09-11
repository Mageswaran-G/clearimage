"use client";

import { useState, useSyncExternalStore } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { ImageFrame } from "@/components/ui/image-frame";
import {
  deleteTempImage,
  getTempImage,
  type TempImageRecord,
} from "@/lib/upload/temp-image-store";
import {
  getCleanupResult,
  type CleanupResultRecord,
} from "@/lib/cleanup/cleanup-result-store";
import { buildExportSummary } from "@/lib/export/export-summary";

interface ExportViewProps {
  id: string;
}

const noSubscription = () => () => {};

export function ExportView({ id }: ExportViewProps) {
  const record: TempImageRecord | null = useSyncExternalStore(
    noSubscription,
    () => getTempImage(id) ?? null,
    () => null,
  );
  const cleanupResult: CleanupResultRecord | null = useSyncExternalStore(
    noSubscription,
    () => getCleanupResult(id) ?? null,
    () => null,
  );
  const [downloaded, setDownloaded] = useState(false);

  if (record === null) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center px-[18px] py-16 text-center md:px-8">
        <h1 className="mb-2 font-display text-2xl font-extrabold text-graphite">
          No image found
        </h1>
        <p className="mb-6 text-text-secondary">
          This session doesn&apos;t have an uploaded image to export. Upload an
          image to begin.
        </p>
        <PrimaryButton href="/upload">Upload an image</PrimaryButton>
      </div>
    );
  }

  if (cleanupResult === null) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center px-[18px] py-16 text-center md:px-8">
        <h1 className="mb-2 font-display text-2xl font-extrabold text-graphite">
          Nothing to export yet
        </h1>
        <p className="mb-6 text-text-secondary">
          This image hasn&apos;t been cleaned up yet. Finish Cleanup to produce
          a result you can export.
        </p>
        <PrimaryButton href={`/cleanup/${id}`}>Go to Cleanup</PrimaryButton>
      </div>
    );
  }

  if (cleanupResult.blob.size === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center px-[18px] py-16 text-center md:px-8">
        <h1 className="mb-2 font-display text-2xl font-extrabold text-graphite">
          Export unavailable
        </h1>
        <p className="mb-6 text-text-secondary">
          The processed image could not be prepared for download. Please return
          to Cleanup and try again.
        </p>
        <PrimaryButton href={`/cleanup/${id}`}>Back to Cleanup</PrimaryButton>
      </div>
    );
  }

  const summary = buildExportSummary(record.file.name, cleanupResult);

  function handleStartOver() {
    // Explicit workflow-end cleanup boundary: only once the user signals
    // they're done with this image (by choosing to process another one) do
    // we revoke its object URLs and drop it from the in-memory stores —
    // never mid-render, and never before "download again" might still be
    // used on this screen.
    deleteTempImage(id);
  }

  return (
    <div className="mx-auto w-full max-w-[780px] flex-1 px-[18px] py-10 md:px-8 md:py-16">
      <div className="mb-2 flex items-baseline gap-2.5 md:gap-3">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-success"
        />
        <span className="font-mono text-[11px] tracking-wide text-success md:text-xs">
          READY TO EXPORT
        </span>
      </div>
      <h1 className="mb-6 font-display text-[26px] font-extrabold tracking-tight text-graphite md:mb-8 md:text-[34px]">
        Your image is ready
      </h1>

      <ImageFrame
        src={summary.previewUrl}
        alt={`Cleaned result: ${record.file.name}`}
        tone="dark"
        aspectRatio="4/3"
        className="mb-5 md:mb-7 md:aspect-[16/10]"
      />

      <div className="mb-6 grid grid-cols-3 gap-4 border-t border-b border-border py-4 md:mb-8 md:gap-5 md:py-5">
        <div>
          <div className="mb-1 font-mono text-[10.5px] text-text-secondary md:text-[11px]">
            FORMAT
          </div>
          <div className="text-[14.5px] font-bold text-graphite md:text-base">
            {summary.format}
          </div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10.5px] text-text-secondary md:text-[11px]">
            RESOLUTION
          </div>
          <div className="text-[14.5px] font-bold text-graphite md:text-base">
            {summary.resolution}
          </div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10.5px] text-text-secondary md:text-[11px]">
            FILE SIZE
          </div>
          <div className="text-[14.5px] font-bold text-graphite md:text-base">
            {summary.fileSizeLabel}
          </div>
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-2.5 md:mb-3 md:flex-row md:gap-3">
        <a
          href={summary.downloadUrl}
          download={summary.downloadFilename}
          onClick={() => setDownloaded(true)}
          className="flex-1 rounded-md bg-teal px-5 py-3.5 text-center text-[14.5px] font-bold text-white transition-colors hover:bg-teal-deep"
        >
          Download Image
        </a>
        <SecondaryButton
          href="/upload"
          onClick={handleStartOver}
          className="flex-1 py-3.5 text-center text-[14.5px]"
        >
          Process Another Image
        </SecondaryButton>
      </div>

      <p
        role="status"
        className="mb-5 min-h-[1.25rem] text-[12.5px] font-medium text-success md:mb-6"
      >
        {downloaded ? "Download started ✓" : ""}
      </p>

      <p className="text-[12.5px] leading-relaxed text-text-secondary">
        Your uploaded file was processed temporarily and will not be retained.
        Only the finished image shown here is available for download.
      </p>
    </div>
  );
}
