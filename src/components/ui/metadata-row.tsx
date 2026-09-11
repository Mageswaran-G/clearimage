interface MetadataRowProps {
  label: string;
  value: string;
  className?: string;
}

/** A single label/value line for displaying image metadata. */
export function MetadataRow({
  label,
  value,
  className = "",
}: MetadataRowProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border py-2 last:border-b-0 ${className}`}
    >
      <span className="font-mono text-xs tracking-wide text-text-secondary uppercase">
        {label}
      </span>
      <span className="font-mono text-sm text-graphite">{value}</span>
    </div>
  );
}
