import Link from "next/link";

/** Desktop-only section. Not present in the approved mobile composition. */
export function BeforeAfterSection() {
  return (
    <section className="hidden bg-workspace-dark px-8 py-24 md:block">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 items-center gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#1B1C22]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#2A2B33,#1B1C22)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#33343B,#24252C)] [clip-path:inset(0_46%_0_0)]" />
          <div className="absolute top-0 bottom-0 left-[54%] w-px bg-teal" />
          <div className="absolute top-1/2 left-[54%] flex h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal text-xs text-white">
            ⟷
          </div>
          <div className="absolute top-4 left-4 font-mono text-[10px] text-text-secondary">
            ORIGINAL
          </div>
          <div className="absolute top-4 right-4 font-mono text-[10px] text-text-secondary">
            CLEANED
          </div>
        </div>
        <div>
          <div className="mb-4 font-mono text-xs tracking-wide text-teal uppercase">
            BEFORE / AFTER
          </div>
          <h2 className="mb-[18px] font-display text-[34px] leading-[1.1] font-extrabold tracking-tight text-white">
            Compare, then decide.
          </h2>
          <p className="mb-6 max-w-[420px] text-base leading-relaxed text-[#8A9497]">
            A precise comparison view, at full resolution, before anything is
            downloaded.
          </p>
          <Link
            href="/upload"
            className="border-b border-teal pb-0.5 text-[14.5px] font-bold text-white"
          >
            Try the comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}
