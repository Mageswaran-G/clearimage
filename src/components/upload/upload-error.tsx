interface UploadErrorProps {
  message: string;
  className?: string;
}

export function UploadError({ message, className = "" }: UploadErrorProps) {
  return (
    <div
      role="alert"
      className={`w-full rounded border-l-2 border-error bg-[#FBF0EE] px-4 py-3.5 ${className}`}
    >
      <p className="text-[13.5px] leading-relaxed text-[#8B3A3A]">{message}</p>
    </div>
  );
}
