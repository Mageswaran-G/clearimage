const CAPABILITIES = [
  {
    n: "01",
    title: "Image Cleanup",
    desc: "Remove authorized marks and unwanted artifacts without degrading quality.",
  },
  {
    n: "02",
    title: "Metadata Inspection",
    desc: "Read EXIF, format, and file details in a clear, readable layout.",
  },
  {
    n: "03",
    title: "Provenance Detection",
    desc: "Check for Content Credentials and other origin signals.",
  },
  {
    n: "04",
    title: "Before / After Comparison",
    desc: "A precise slider to compare original and cleaned results.",
  },
  {
    n: "05",
    title: "Quality-Preserving Export",
    desc: "Download at the original resolution and format.",
  },
  {
    n: "06",
    title: "Privacy-Conscious Processing",
    desc: "Files are processed temporarily and removed afterward.",
  },
];

export function CapabilitiesSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1320px] px-[18px] py-9 md:px-8 md:py-20"
    >
      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-12">
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-graphite md:mb-0 md:text-[32px]">
          Capabilities
        </h2>
        <div>
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.n}
              className="border-b border-border py-[18px] md:grid md:grid-cols-[50px_1fr_1.3fr] md:items-baseline md:gap-6 md:py-[26px]"
            >
              <div className="mb-1 flex items-baseline gap-3.5 md:contents">
                <span className="font-mono text-xs text-text-secondary">
                  {cap.n}
                </span>
                <div className="text-base font-bold md:text-lg">
                  {cap.title}
                </div>
              </div>
              <div className="pl-[26px] text-sm leading-relaxed text-text-secondary md:pl-0 md:text-[14.5px]">
                {cap.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
