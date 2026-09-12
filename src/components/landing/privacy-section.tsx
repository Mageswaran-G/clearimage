const ROWS = [
  {
    title: "Local by default",
    desc: "Inspection, provenance, blur, and crop all run in your browser. Your image is never uploaded anywhere to use them.",
  },
  {
    title: "Cloud steps are temporary",
    desc: "Optional cloud-based cleanup sends your image for processing only, over an encrypted connection, and doesn't keep a copy afterward.",
  },
  {
    title: "Transparent processing",
    desc: "Every analysis step is shown to you, not hidden away.",
  },
];

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="mx-auto max-w-[1000px] px-[18px] py-11 md:px-8 md:py-[110px]"
    >
      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-12">
        <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-graphite md:mb-0 md:text-[32px]">
          Your images
          <br className="hidden md:inline" /> are yours.
        </h2>
        <div>
          {ROWS.map((row, index) => (
            <div
              key={row.title}
              className={`flex flex-col gap-1 py-4 md:flex-row md:justify-between md:gap-6 md:py-5 ${index < ROWS.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex-none text-[14.5px] font-bold md:w-[220px] md:text-[15px]">
                {row.title}
              </div>
              <div className="text-[13.5px] leading-relaxed text-text-secondary md:text-[14.5px]">
                {row.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
