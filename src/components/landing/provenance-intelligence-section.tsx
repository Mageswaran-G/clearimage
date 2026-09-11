const SIGNALS = [
  { label: "METADATA", value: "Available" },
  { label: "RESOLUTION", value: "3840 × 2160" },
  { label: "COLOR PROFILE", value: "sRGB" },
  { label: "CONTENT CREDENTIALS", value: "Unavailable" },
  { label: "EDITING SIGNALS", value: "None found" },
  { label: "FILE CHARACTERISTICS", value: "Standard" },
];

export function ProvenanceIntelligenceSection() {
  return (
    <section className="bg-graphite px-[18px] py-11 md:px-8 md:py-[110px]">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-4 font-mono text-xs tracking-wide text-teal uppercase md:mb-5">
          PROVENANCE INTELLIGENCE
        </div>
        <h2 className="mb-7 max-w-[700px] font-display text-[26px] leading-[1.1] font-black tracking-tight text-white md:mb-12 md:text-[clamp(30px,4vw,44px)] md:tracking-[-0.015em]">
          Know what your image carries.
        </h2>
        <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-[#22232A] bg-[#22232A] md:grid md:grid-cols-3">
          {SIGNALS.map((signal) => (
            <div
              key={signal.label}
              className="flex items-baseline justify-between gap-4 bg-workspace-dark p-4 md:block md:p-6"
            >
              <div className="font-mono text-[11px] tracking-wide text-[#6E6F76] md:mb-2">
                {signal.label}
              </div>
              <div className="text-sm font-bold text-[#F0F0F2] md:text-base">
                {signal.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
