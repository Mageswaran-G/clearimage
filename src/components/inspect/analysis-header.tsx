interface AnalysisHeaderProps {
  fileName: string;
  className?: string;
}

/** Filename caption + "Analysis" title. Not the page/nav header — see WorkflowHeader for that. */
export function AnalysisHeader({
  fileName,
  className = "",
}: AnalysisHeaderProps) {
  return (
    <div className={className}>
      <div className="mb-1 truncate font-mono text-[11px] tracking-wide text-text-secondary md:mb-1.5 md:text-xs">
        {fileName}
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-graphite md:text-[30px]">
        Analysis
      </h1>
    </div>
  );
}
