interface ProvenanceStatusProps {
  className?: string;
}

/**
 * Honest status copy: since Content Credentials (C2PA) inspection is not
 * implemented yet, this deliberately does NOT say anything was "detected"
 * or "not detected" — only that the check itself is unavailable.
 */
export function ProvenanceStatus({ className = "" }: ProvenanceStatusProps) {
  return (
    <div
      className={`flex items-center gap-2.5 border-t border-b border-border py-4 ${className}`}
    >
      <span className="h-[7px] w-[7px] flex-none rounded-full bg-text-secondary md:h-2 md:w-2" />
      <span className="font-mono text-[11px] tracking-wide text-text-secondary md:text-[12.5px]">
        <span className="hidden md:inline">PROVENANCE STATUS — </span>
        CONTENT CREDENTIALS CHECK NOT AVAILABLE
      </span>
    </div>
  );
}
