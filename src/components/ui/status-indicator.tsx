type Status = "success" | "warning" | "error" | "neutral";

interface StatusIndicatorProps {
  status: Status;
  label: string;
  className?: string;
}

const statusDotClass: Record<Status, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  neutral: "bg-text-secondary",
};

export function StatusIndicator({
  status,
  label,
  className = "",
}: StatusIndicatorProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-graphite ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${statusDotClass[status]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
