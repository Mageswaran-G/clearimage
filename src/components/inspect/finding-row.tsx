import type { Finding } from "@/lib/inspect/findings";

type FindingRowProps = Finding;

/**
 * A single finding. Rows with a `detail` render the "primary" treatment
 * (title + detail, larger dot); rows without render the compact
 * "secondary" treatment (title only).
 */
export function FindingRow({
  title,
  detail,
  status,
  dotClassName,
}: FindingRowProps) {
  if (detail) {
    return (
      <div className="flex items-baseline justify-between gap-6 border-b border-border py-3.5 md:py-4">
        <div>
          <div className="mb-0.5 text-[14.5px] font-semibold md:text-[15px]">
            {title}
          </div>
          <div className="text-[13px] text-text-secondary md:text-[13.5px]">
            {detail}
          </div>
        </div>
        <div className="ml-6 flex flex-none items-center gap-2">
          <span
            className={`h-[6px] w-[6px] rounded-full md:h-[7px] md:w-[7px] ${dotClassName}`}
          />
          <span className="font-mono text-[11.5px] whitespace-nowrap text-text-secondary md:text-xs">
            {status}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 md:py-3.5">
      <span className="text-[13.5px] text-text-secondary md:text-sm">
        {title}
      </span>
      <div className="ml-6 flex flex-none items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
        <span className="font-mono text-[11px] whitespace-nowrap text-text-secondary md:text-[11.5px]">
          {status}
        </span>
      </div>
    </div>
  );
}
