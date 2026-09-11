interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  className?: string;
}

const buttonClasses =
  "flex h-8 items-center justify-center rounded-md border border-[#22232A] px-2.5 text-[#C7C8CC] transition-colors hover:border-teal hover:text-teal disabled:pointer-events-none disabled:opacity-50";

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  className = "",
}: ZoomControlsProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        className={`${buttonClasses} w-8 text-base`}
      >
        −
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        className={`${buttonClasses} w-8 text-base`}
      >
        +
      </button>
      <button
        type="button"
        onClick={onFit}
        className={`${buttonClasses} font-mono text-[11px] tracking-wide`}
      >
        FIT
      </button>
      <button
        type="button"
        onClick={onReset}
        className={`${buttonClasses} font-mono text-[11px] tracking-wide`}
      >
        RESET
      </button>
    </div>
  );
}
