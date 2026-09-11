"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ImageFrame } from "@/components/ui/image-frame";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { AnalysisHeader } from "@/components/inspect/analysis-header";
import { StatGrid, type Stat } from "@/components/inspect/stat-grid";
import { FindingList } from "@/components/inspect/finding-list";
import {
  getTempImage,
  type TempImageRecord,
} from "@/lib/upload/temp-image-store";
import { inspectImage } from "@/lib/inspect/inspect-image";
import {
  buildPrimaryFindings,
  overallStatus,
  SECONDARY_FINDINGS,
} from "@/lib/inspect/findings";
import type { InspectionResult } from "@/lib/inspect/types";
import { formatFileSize } from "@/lib/format-file-size";

interface AnalysisViewProps {
  id: string;
}

// The temp image store is a plain in-memory Map, not reactive state — it
// never changes for a given id once Upload has written it, so a no-op
// subscribe is correct here (nothing external will trigger a re-read).
const noSubscription = () => () => {};

export function AnalysisView({ id }: AnalysisViewProps) {
  // useSyncExternalStore (not useState+useEffect) so the server snapshot
  // (no data, since the store lives only in browser memory) and the client
  // snapshot stay consistent: a client-side nav from Upload sees the real
  // record immediately, and a hard reload correctly sees "not found" on
  // both server and client, since the in-memory store is gone either way.
  const record: TempImageRecord | null = useSyncExternalStore(
    noSubscription,
    () => getTempImage(id) ?? null,
    () => null,
  );
  const [result, setResult] = useState<InspectionResult | null>(null);

  useEffect(() => {
    if (!record) return;
    let cancelled = false;
    inspectImage(record.file, record.previewUrl).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [record]);

  if (record === null) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center px-[18px] py-16 text-center md:px-8">
        <h1 className="mb-2 font-display text-2xl font-extrabold text-graphite">
          No image found
        </h1>
        <p className="mb-6 text-text-secondary">
          This session doesn&apos;t have an uploaded image to analyze. Upload an
          image to begin.
        </p>
        <PrimaryButton href="/upload">Upload an image</PrimaryButton>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto w-full max-w-[900px] flex-1 px-[18px] py-16 text-center text-text-secondary md:px-8">
        Analyzing…
      </div>
    );
  }

  const stats: Stat[] = [
    {
      label: "RESOLUTION",
      value: result.dimensions
        ? `${result.dimensions.width} × ${result.dimensions.height}`
        : "—",
    },
    { label: "FORMAT", value: result.format },
    { label: "FILE SIZE", value: formatFileSize(result.fileSizeBytes) },
    {
      label: "STATUS",
      value: overallStatus(result).label,
      valueClassName: overallStatus(result).className,
    },
  ];

  const primaryFindings = buildPrimaryFindings(result);
  const fullReportHref = `/provenance/${id}`;
  const cleanupHref = `/cleanup/${id}`;

  return (
    <div className="mx-auto w-full max-w-[1320px] flex-1 px-[18px] py-8 md:px-8 md:py-12">
      {/* Mobile composition */}
      <div className="md:hidden">
        <ImageFrame
          src={record.previewUrl}
          alt={`Preview of ${record.file.name}`}
          tone="dark"
          aspectRatio="4/3"
          className="mb-5"
        />
        <AnalysisHeader fileName={record.file.name} className="mb-5" />
        <StatGrid stats={stats} className="mb-8" />
        <FindingList
          title="PRIMARY FINDINGS"
          findings={primaryFindings}
          variant="mobile"
          className="mb-7"
        />
        <FindingList
          title="SECONDARY FINDINGS"
          findings={SECONDARY_FINDINGS}
          variant="mobile"
        />
        <div className="mt-7 flex flex-col gap-2.5">
          <PrimaryButton
            href={cleanupHref}
            className="w-full py-[15px] text-[15px]"
          >
            Continue to Cleanup
          </PrimaryButton>
          <SecondaryButton
            href={fullReportHref}
            className="w-full py-3.5 text-center"
          >
            Full Report
          </SecondaryButton>
        </div>
      </div>

      {/* Desktop composition */}
      <div className="hidden md:block">
        <div className="mb-14 grid grid-cols-[1.3fr_1fr] gap-14">
          <ImageFrame
            src={record.previewUrl}
            alt={`Preview of ${record.file.name}`}
            tone="dark"
            aspectRatio="4/3"
          />
          <div>
            <AnalysisHeader fileName={record.file.name} className="mb-7" />
            <StatGrid stats={stats} className="mb-9" />
            <div className="flex gap-3.5">
              <SecondaryButton href={fullReportHref}>
                Full Report
              </SecondaryButton>
              <PrimaryButton href={cleanupHref} className="px-6 py-3 text-sm">
                Continue to Cleanup
              </PrimaryButton>
            </div>
          </div>
        </div>
        <FindingList
          title="Primary findings"
          findings={primaryFindings}
          variant="desktop"
          className="mb-11"
        />
        <FindingList
          title="Secondary findings"
          findings={SECONDARY_FINDINGS}
          variant="desktop"
          muted
        />
      </div>
    </div>
  );
}
