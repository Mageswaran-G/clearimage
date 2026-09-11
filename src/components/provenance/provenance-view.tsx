"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { InfoRow } from "@/components/provenance/info-row";
import { TooltipLabel } from "@/components/provenance/tooltip-label";
import { ProvenanceStatus } from "@/components/provenance/provenance-status";
import {
  getTempImage,
  type TempImageRecord,
} from "@/lib/upload/temp-image-store";
import {
  buildMetadataRows,
  buildProvenanceSummary,
} from "@/lib/provenance/provenance-summary";
import type { ProvenanceSummary } from "@/lib/provenance/types";

interface ProvenanceViewProps {
  id: string;
}

const CONTENT_CREDENTIALS_TOOLTIP =
  "A tamper-evident record some tools attach to an image describing how it was made or edited.";
const METADATA_TOOLTIP =
  "Technical information embedded in the file itself, such as camera settings or software used.";

const noSubscription = () => () => {};

export function ProvenanceView({ id }: ProvenanceViewProps) {
  const record: TempImageRecord | null = useSyncExternalStore(
    noSubscription,
    () => getTempImage(id) ?? null,
    () => null,
  );
  const [summary, setSummary] = useState<ProvenanceSummary | null>(null);

  useEffect(() => {
    if (!record) return;
    let cancelled = false;
    buildProvenanceSummary(record.file, record.previewUrl).then((s) => {
      if (!cancelled) setSummary(s);
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
          This session doesn&apos;t have an uploaded image to inspect. Upload an
          image to begin.
        </p>
        <PrimaryButton href="/upload">Upload an image</PrimaryButton>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto w-full max-w-[900px] flex-1 px-[18px] py-16 text-center text-text-secondary md:px-8">
        Reading provenance…
      </div>
    );
  }

  const metadataRows = buildMetadataRows(summary.metadata);
  const identityRows = [
    { label: "File format", value: summary.identity.format },
    { label: "Resolution", value: summary.identity.resolution },
    { label: "File size", value: summary.identity.fileSizeLabel },
    { label: "Color space", value: summary.identity.colorSpace },
  ];
  const cleanupHref = `/cleanup/${id}`;

  return (
    <div className="mx-auto w-full max-w-[900px] flex-1 px-[18px] py-8 md:px-8 md:py-16">
      {/* Mobile composition */}
      <div className="md:hidden">
        <div className="mb-2 truncate font-mono text-[11px] tracking-wide text-text-secondary">
          {summary.fileName}
        </div>
        <h1 className="mb-[18px] font-display text-2xl font-extrabold tracking-tight text-graphite">
          Image provenance
        </h1>
        <ProvenanceStatus className="mb-7" />

        <div className="mb-[26px]">
          <div className="mb-2.5 text-[15px] font-bold text-graphite">
            File identity
          </div>
          <div>
            {identityRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </div>
        </div>

        <div className="mb-[26px]">
          <div className="mb-2.5 text-[15px] font-bold text-graphite">
            Metadata
          </div>
          <div>
            {metadataRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </div>
        </div>

        <div className="mb-[26px]">
          <div className="mb-2 text-[15px] font-bold text-graphite">
            Content Credentials
          </div>
          <p className="text-[13.5px] leading-relaxed text-text-secondary">
            Content Credentials (C2PA) verification is not available in this
            version. This section will show whether the file carries a
            tamper-evident manifest once supported.
          </p>
        </div>

        <div className="mb-7">
          <div className="mb-2 text-[15px] font-bold text-graphite">
            Editing signals
          </div>
          <p className="text-[13.5px] leading-relaxed text-text-secondary">
            {summary.editing.description}
          </p>
        </div>

        <div className="mb-7 border-l-2 border-border pl-3.5">
          <p className="text-xs leading-relaxed text-text-secondary">
            Provenance information can vary by platform, export method, and
            image source.
          </p>
        </div>

        <PrimaryButton
          href={cleanupHref}
          className="w-full py-[15px] text-[15px]"
        >
          Continue to Cleanup
        </PrimaryButton>
      </div>

      {/* Desktop composition */}
      <div className="hidden md:block">
        <div className="mb-2.5 font-mono text-xs tracking-wide text-text-secondary">
          {summary.fileName}
        </div>
        <h1 className="mb-7 font-display text-[34px] font-extrabold tracking-tight text-graphite">
          Image provenance
        </h1>
        <ProvenanceStatus className="mb-11" />

        <section className="mb-10 grid grid-cols-[200px_1fr] gap-12">
          <div className="text-base font-bold text-graphite">File identity</div>
          <div>
            {identityRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </div>
        </section>

        <section className="mb-10 grid grid-cols-[200px_1fr] gap-12">
          <TooltipLabel label="Metadata" tooltip={METADATA_TOOLTIP} />
          <div>
            {metadataRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </div>
        </section>

        <section className="mb-10 grid grid-cols-[200px_1fr] gap-12">
          <TooltipLabel
            label="Content Credentials"
            tooltip={CONTENT_CREDENTIALS_TOOLTIP}
          />
          <p className="text-sm leading-relaxed text-text-secondary">
            Content Credentials (C2PA) verification is not available in this
            version. This section will show whether the file carries a
            tamper-evident manifest once supported.
          </p>
        </section>

        <section className="mb-14 grid grid-cols-[200px_1fr] gap-12">
          <div className="text-base font-bold text-graphite">
            Editing signals
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {summary.editing.description}
          </p>
        </section>

        <div className="mb-11 border-l-2 border-border pl-4">
          <p className="text-[12.5px] leading-relaxed text-text-secondary">
            Provenance information can vary by platform, export method, and
            image source.
          </p>
        </div>

        <div className="flex justify-end gap-3.5">
          <PrimaryButton
            href={cleanupHref}
            className="px-[26px] py-[13px] text-[14.5px]"
          >
            Continue to Cleanup
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
