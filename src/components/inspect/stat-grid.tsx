import { TechnicalLabel } from "@/components/ui/technical-label";

export interface Stat {
  label: string;
  value: string;
  valueClassName?: string;
}

interface StatGridProps {
  stats: Stat[];
  className?: string;
}

/** The RESOLUTION / FORMAT / FILE SIZE / STATUS 2x2 grid. */
export function StatGrid({ stats, className = "" }: StatGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 md:gap-5 ${className}`}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <TechnicalLabel className="mb-1 block">{stat.label}</TechnicalLabel>
          <div
            className={`text-[15px] font-bold md:text-[19px] ${stat.valueClassName ?? ""}`}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
