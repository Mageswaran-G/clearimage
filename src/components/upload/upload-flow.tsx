"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { UploadStatus } from "@/components/upload/upload-status";
import { UploadPreview } from "@/components/upload/upload-preview";
import {
  processSelectedFile,
  type ProcessedImage,
} from "@/lib/upload/validate-image";
import {
  createTempImageId,
  saveTempImage,
} from "@/lib/upload/temp-image-store";

type Phase = "idle" | "processing" | "preview";

export function UploadFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setDragOver(false);
    setError(null);
    setPhase("processing");

    const result = await processSelectedFile(file);

    if (!result.ok) {
      setError(result.error.message);
      setPhase("idle");
      return;
    }

    setProcessed(result.value);
    setPhase("preview");
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  function reset() {
    if (processed) URL.revokeObjectURL(processed.previewUrl);
    setProcessed(null);
    setError(null);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function analyze() {
    if (!processed) return;
    const id = createTempImageId();
    saveTempImage(id, {
      file: processed.file,
      previewUrl: processed.previewUrl,
      dimensions: processed.dimensions,
    });
    router.push(`/inspect/${id}`);
  }

  return (
    <div className="flex w-full flex-col items-center">
      {phase === "idle" && (
        <UploadDropzone
          dragOver={dragOver}
          error={error}
          fileInputRef={fileInputRef}
          onDragOver={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDropFile={handleFile}
          onFileChange={handleFile}
          onOpenPicker={openPicker}
        />
      )}

      {phase === "processing" && <UploadStatus />}

      {phase === "preview" && processed && (
        <UploadPreview
          file={processed.file}
          previewUrl={processed.previewUrl}
          dimensions={processed.dimensions}
          onReset={reset}
          onAnalyze={analyze}
        />
      )}
    </div>
  );
}
