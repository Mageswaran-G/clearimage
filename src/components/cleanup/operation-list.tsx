import type { CleanupOperation, CleanupOperationId } from "@/lib/cleanup/types";

interface OperationListProps {
  operations: CleanupOperation[];
  selectedId: CleanupOperationId;
  onSelect: (id: CleanupOperationId) => void;
  disabled: boolean;
  className?: string;
}

/** Horizontal scroll row on narrow screens, full-width vertical list from
 * `md:` up — one responsive tree rather than duplicated markup, since these
 * buttons carry no per-breakpoint content difference, only layout. */
export function OperationList({
  operations,
  selectedId,
  onSelect,
  disabled,
  className = "",
}: OperationListProps) {
  return (
    <div
      role="group"
      aria-label="Cleanup operation"
      className={`flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0 ${className}`}
    >
      {operations.map((op) => {
        const selected = op.id === selectedId;
        const itemDisabled = disabled || !op.available;
        return (
          <button
            key={op.id}
            type="button"
            aria-pressed={selected}
            disabled={itemDisabled}
            title={op.available ? undefined : "Not available yet"}
            onClick={() => onSelect(op.id)}
            className={`flex-none rounded-md px-3 py-2.5 text-left text-[13.5px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:w-full md:whitespace-normal ${
              selected
                ? "bg-[#0F2626] text-[#6FD6D1]"
                : "bg-transparent text-[#C7C8CC] hover:bg-[#15151C]"
            }`}
          >
            {op.label}
            {!op.available && (
              <span className="ml-1.5 font-mono text-[10px] text-text-secondary">
                SOON
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
