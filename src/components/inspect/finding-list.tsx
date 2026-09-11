import { TechnicalLabel } from "@/components/ui/technical-label";
import { FindingRow } from "@/components/inspect/finding-row";
import type { Finding } from "@/lib/inspect/findings";

interface FindingListProps {
  title: string;
  findings: Finding[];
  /** Desktop: bold headline in a fixed-width label column beside the rows.
   *  Mobile: small mono caption stacked above full-width rows. */
  variant: "desktop" | "mobile";
  muted?: boolean;
  className?: string;
}

export function FindingList({
  title,
  findings,
  variant,
  muted = false,
  className = "",
}: FindingListProps) {
  if (variant === "mobile") {
    return (
      <section className={className}>
        <TechnicalLabel className="mb-3 block">{title}</TechnicalLabel>
        <div>
          {findings.map((finding) => (
            <FindingRow key={finding.title} {...finding} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`grid grid-cols-[200px_1fr] gap-12 ${className}`}>
      <div
        className={`text-base font-bold ${muted ? "text-text-secondary" : "text-graphite"}`}
      >
        {title}
      </div>
      <div>
        {findings.map((finding) => (
          <FindingRow key={finding.title} {...finding} />
        ))}
      </div>
    </section>
  );
}
