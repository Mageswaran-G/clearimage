interface InfoRowProps {
  label: string;
  value: string;
  className?: string;
}

/** Label/value row used in both File identity and Metadata sections. */
export function InfoRow({ label, value, className = "" }: InfoRowProps) {
  return (
    <div
      className={`flex justify-between gap-4 border-b border-border py-[11px] text-[13.5px] last:border-b-0 md:py-[13px] md:text-sm ${className}`}
    >
      <span className="font-semibold text-text-secondary">{label}</span>
      <span className="font-mono font-semibold text-graphite">{value}</span>
    </div>
  );
}
