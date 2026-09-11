export function UploadStatus() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-lg bg-workspace-dark py-[70px] text-center md:py-[100px]"
    >
      <div className="mx-auto mb-3.5 h-[26px] w-[26px] animate-spin rounded-full border-[2.5px] border-[#22232A] border-t-teal md:mb-4 md:h-[30px] md:w-[30px] md:border-[#33343B]" />
      <div className="font-mono text-[12.5px] font-medium text-[#C7C8CC] md:text-[13px]">
        UPLOADING…
      </div>
    </div>
  );
}
