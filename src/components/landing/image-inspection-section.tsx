import Link from "next/link";

const STATUS_ROWS = [
  { label: "Metadata", dot: "bg-success" },
  { label: "Content Credentials", dot: "bg-text-secondary" },
  { label: "Visible marks", dot: "bg-warning" },
];

/** Desktop-only section. Not present in the approved mobile composition. */
export function ImageInspectionSection() {
  return (
    <section className="mx-auto hidden max-w-[1320px] grid-cols-2 items-center gap-16 px-8 pt-6 pb-24 md:grid">
      <div>
        <div className="mb-4 font-mono text-xs tracking-wide text-text-secondary uppercase">
          IMAGE INSPECTION
        </div>
        <h2 className="mb-[18px] font-display text-[34px] leading-[1.1] font-extrabold tracking-tight text-graphite">
          Every file, read in full.
        </h2>
        <p className="mb-6 max-w-[420px] text-base leading-relaxed text-text-secondary">
          Format, resolution, embedded metadata, and available Content
          Credentials — surfaced plainly, without guesswork.
        </p>
        <Link
          href="/upload"
          className="border-b border-teal pb-0.5 text-[14.5px] font-bold text-graphite"
        >
          View a sample report →
        </Link>
      </div>
      <div className="aspect-[5/4] rounded-lg bg-workspace-dark p-6">
        <div className="flex h-full flex-col justify-center gap-3.5">
          {STATUS_ROWS.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between pb-3 ${index < STATUS_ROWS.length - 1 ? "border-b border-[#26272E]" : ""}`}
            >
              <span className="font-mono text-xs text-[#C7C8CC]">
                {row.label}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
