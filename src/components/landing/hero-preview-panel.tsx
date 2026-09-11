/**
 * Decorative preview of the product's dark image workspace, shown beside
 * (desktop) or above (mobile) the hero copy. Desktop and mobile use
 * different color nesting and stat counts, matching the approved
 * breakpoint-specific reference compositions (not normalized into one).
 */
export function HeroPreviewPanel() {
  return (
    <>
      {/* Desktop */}
      <div className="relative hidden min-h-[440px] rounded-[10px] bg-workspace-dark p-7 md:block">
        <div className="absolute inset-5 rounded-md border border-dashed border-[#33343B]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="rounded bg-[rgba(20,21,26,0.6)] px-2 py-1 font-mono text-[11px] text-text-secondary">
              image_04.jpg
            </span>
            <span className="rounded bg-[rgba(20,21,26,0.6)] px-2 py-1 font-mono text-[11px] text-text-secondary">
              3840 × 2160
            </span>
          </div>
          <div className="relative self-center">
            <div className="relative h-[190px] w-[280px] rounded-md bg-[linear-gradient(140deg,#2A2B33,#1B1C22)]">
              <div className="absolute top-6 right-[100px] bottom-[58px] left-6 rounded border-[1.5px] border-teal" />
              <div className="absolute top-5 left-6 -translate-y-full rounded bg-teal px-1.5 py-0.5 text-[10px] font-bold text-white">
                MARK DETECTED
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-4 font-mono text-[11px] text-[#C7C8CC]">
            <div>
              <span className="text-text-secondary">METADATA</span>
              <br />
              Available
            </div>
            <div className="text-center">
              <span className="text-text-secondary">C2PA</span>
              <br />
              Unavailable
            </div>
            <div className="text-right">
              <span className="text-text-secondary">MARKS</span>
              <br />1 found
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="relative mb-5 min-h-[280px] rounded-[10px] bg-graphite p-[22px] md:hidden">
        <div className="absolute inset-4 rounded-md border border-dashed border-[#22232A]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex justify-between font-mono text-[10.5px] text-text-secondary">
            <span>image_04.jpg</span>
            <span>3840 × 2160</span>
          </div>
          <div className="relative self-center">
            <div className="relative h-[130px] w-[190px] rounded-md bg-workspace-dark">
              <div className="absolute top-4 right-[60px] bottom-9 left-4 rounded border-[1.5px] border-teal" />
              <div className="absolute top-3.5 left-4 -translate-y-full rounded bg-teal px-[5px] py-0.5 text-[9px] font-bold text-white">
                MARK DETECTED
              </div>
            </div>
          </div>
          <div className="flex justify-between gap-2.5 font-mono text-[10px] text-[#C7C8CC]">
            <div>
              <span className="text-text-secondary">METADATA</span>
              <br />
              Available
            </div>
            <div className="text-right">
              <span className="text-text-secondary">MARKS</span>
              <br />1 found
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
