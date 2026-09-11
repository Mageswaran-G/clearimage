"use client";

import type { DragEvent, KeyboardEvent } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { UploadError } from "@/components/upload/upload-error";
import { FILE_INPUT_ACCEPT, MAX_UPLOAD_SIZE_MB } from "@/lib/upload/constants";

interface CornerBracketsProps {
  size: number;
  inset: number;
}

function CornerBrackets({ size, inset }: CornerBracketsProps) {
  const style = { width: size, height: size };
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute border-t-[1.5px] border-l-[1.5px] border-teal"
        style={{ ...style, top: inset, left: inset }}
      />
      <span
        aria-hidden="true"
        className="absolute border-t-[1.5px] border-r-[1.5px] border-teal"
        style={{ ...style, top: inset, right: inset }}
      />
      <span
        aria-hidden="true"
        className="absolute border-b-[1.5px] border-l-[1.5px] border-teal"
        style={{ ...style, bottom: inset, left: inset }}
      />
      <span
        aria-hidden="true"
        className="absolute border-b-[1.5px] border-r-[1.5px] border-teal"
        style={{ ...style, bottom: inset, right: inset }}
      />
    </>
  );
}

interface UploadDropzoneProps {
  dragOver: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDropFile: (file: File | undefined) => void;
  onFileChange: (file: File | undefined) => void;
  onOpenPicker: () => void;
}

/**
 * Idle-state file picker. Desktop is the interactive drag/drop + click
 * target (dark panel). Mobile's box is decorative only (light panel,
 * matching the approved mobile reference exactly) — a separate full-width
 * button is the actual picker trigger there.
 */
export function UploadDropzone({
  dragOver,
  error,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDropFile,
  onFileChange,
  onOpenPicker,
}: UploadDropzoneProps) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDropFile(event.dataTransfer.files[0]);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragOver();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenPicker();
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Choose an image file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />

      {/* Desktop: dark, interactive drop target */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop your image here, or choose a file"
        onClick={onOpenPicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        className={`relative hidden w-full cursor-pointer rounded-lg px-6 py-[100px] text-center transition-colors md:block ${
          dragOver ? "bg-[#15151C]" : "bg-workspace-dark"
        }`}
      >
        <CornerBrackets size={22} inset={18} />
        <div className="mb-2 font-display text-xl font-bold text-white">
          Drop your image here
        </div>
        <div className="text-[14.5px] text-text-secondary">
          or <span className="font-bold text-teal">choose a file</span>
        </div>
      </div>

      {/* Mobile: light, decorative box + explicit button (matches approved mobile reference) */}
      <div className="relative w-full rounded-lg border border-border bg-background px-5 py-[60px] text-center md:hidden">
        <CornerBrackets size={18} inset={14} />
        <div className="mb-1.5 font-display text-lg font-bold text-graphite">
          Drop your image here
        </div>
        <div className="text-[13.5px] text-text-secondary">
          Drag not required on mobile
        </div>
      </div>
      <PrimaryButton
        type="button"
        onClick={onOpenPicker}
        className="mt-4 w-full md:hidden"
      >
        Choose a file
      </PrimaryButton>

      {error && <UploadError message={error} className="mt-4" />}

      <div className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2.5 font-mono text-[11px] text-text-secondary md:justify-start md:gap-x-8 md:text-[11.5px]">
        <span>JPG · PNG · WEBP</span>
        <span>UP TO {MAX_UPLOAD_SIZE_MB} MB</span>
        <span>PROCESSED, THEN DELETED</span>
      </div>
    </div>
  );
}
