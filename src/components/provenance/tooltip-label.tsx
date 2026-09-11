interface TooltipLabelProps {
  label: string;
  tooltip: string;
  className?: string;
}

/** Desktop-only section heading with a hover-revealed explanation (approved reference has no mobile equivalent). */
export function TooltipLabel({
  label,
  tooltip,
  className = "",
}: TooltipLabelProps) {
  return (
    <span
      className={`group relative inline-flex items-center gap-1.5 ${className}`}
    >
      <span className="text-base font-bold text-graphite">{label}</span>
      <span aria-hidden="true" className="text-sm text-text-secondary">
        ⓘ
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-[230px] rounded-md bg-graphite px-3 py-2 text-xs leading-relaxed font-medium text-white group-hover:block"
      >
        {tooltip}
      </span>
    </span>
  );
}
