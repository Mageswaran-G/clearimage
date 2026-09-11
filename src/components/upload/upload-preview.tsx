/* eslint-disable @next/next/no-img-element -- object-URL preview, not a static/remote asset Next's image optimizer should handle */
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { formatFileSize } from "@/lib/format-file-size";
import type { ImageDimensions } from "@/lib/upload/validate-image";

interface UploadPreviewProps {
  file: File;
  previewUrl: string;
  dimensions: ImageDimensions;
  onReset: () => void;
  onAnalyze: () => void;
}

export function UploadPreview({
  file,
  previewUrl,
  dimensions,
  onReset,
  onAnalyze,
}: UploadPreviewProps) {
  const fileType = file.type.replace("image/", "").toUpperCase();
  const fileSize = formatFileSize(file.size);
  const resolution = `${dimensions.width} × ${dimensions.height}`;

  return (
    <div className="w-full rounded-lg bg-workspace-dark p-[18px] md:p-6">
      {/* Desktop: 200px thumbnail + info side by side */}
      <div className="hidden md:grid md:grid-cols-[200px_1fr] md:gap-6">
        <div className="aspect-square overflow-hidden rounded-md bg-[#1B1C22]">
          <img
            src={previewUrl}
            alt={`Preview of ${file.name}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-2.5">
          <div className="truncate text-[15px] font-semibold break-words text-white">
            {file.name}
          </div>
          <div className="flex gap-7 font-mono text-xs text-text-secondary">
            <span>{fileType}</span>
            <span>{fileSize}</span>
            <span>{resolution}</span>
          </div>
        </div>
      </div>
      <div className="hidden justify-end gap-3 pt-6 md:flex">
        <SecondaryButton tone="dark" onClick={onReset}>
          Choose different file
        </SecondaryButton>
        <PrimaryButton onClick={onAnalyze} className="px-6 py-3 text-sm">
          Analyze Image
        </PrimaryButton>
      </div>

      {/* Mobile: stacked, full-width actions, Analyze first */}
      <div className="md:hidden">
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded-md bg-graphite">
          <img
            src={previewUrl}
            alt={`Preview of ${file.name}`}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="mb-2 text-[14.5px] font-semibold break-words text-white">
          {file.name}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-[18px] gap-y-1.5 font-mono text-[11.5px] text-text-secondary">
          <span>{fileType}</span>
          <span>{fileSize}</span>
          <span>{resolution}</span>
        </div>
        <PrimaryButton
          onClick={onAnalyze}
          className="mb-2.5 w-full py-[15px] text-[15px]"
        >
          Analyze Image
        </PrimaryButton>
        <SecondaryButton
          tone="dark"
          onClick={onReset}
          className="w-full py-3.5"
        >
          Choose different file
        </SecondaryButton>
      </div>
    </div>
  );
}
