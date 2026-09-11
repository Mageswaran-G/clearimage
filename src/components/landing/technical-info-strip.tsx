const ITEMS = [
  { label: "FORMAT", value: "JPG · PNG · WEBP" },
  { label: "MAX SIZE", value: "25 MB" },
  { label: "RETENTION", value: "Temporary" },
  { label: "ACCOUNT", value: "Not required" },
];

/** Desktop-only strip of quick facts below the hero. Not present in the approved mobile composition. */
export function TechnicalInfoStrip() {
  return (
    <section className="mx-auto hidden max-w-[1320px] grid-cols-4 gap-4 border-b border-border px-8 pt-6 pb-10 md:grid">
      {ITEMS.map((item) => (
        <div
          key={item.label}
          className="font-mono text-xs tracking-wide text-text-secondary"
        >
          {item.label}
          <br />
          <span className="text-sm text-graphite">{item.value}</span>
        </div>
      ))}
    </section>
  );
}
