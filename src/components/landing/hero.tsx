import Link from "next/link";
import { PrimaryButton } from "@/components/ui/primary-button";
import { HeroPreviewPanel } from "@/components/landing/hero-preview-panel";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1320px] items-center gap-8 px-[18px] pt-7 pb-10 md:grid-cols-[0.95fr_1.05fr] md:gap-16 md:px-8 md:pt-24 md:pb-10">
      <div className="min-w-0">
        <div className="mb-4 font-mono text-[11px] tracking-wide text-text-secondary uppercase md:mb-5 md:text-xs">
          FREE · NO ACCOUNT REQUIRED
        </div>
        <h1 className="mb-[18px] font-display text-[clamp(34px,9vw,44px)] leading-[1.02] font-black tracking-tight text-graphite md:mb-7 md:text-[clamp(42px,5.6vw,68px)] md:leading-[1.0]">
          Clean the image.
          <br className="hidden md:inline" /> Understand the file.
        </h1>
        <p className="mb-6 max-w-[440px] text-base leading-relaxed text-text-secondary md:mb-9 md:text-lg">
          Inspect metadata and provenance, detect visible marks, and remove
          authorized artifacts — in one pass.
        </p>
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:gap-4">
          <PrimaryButton href="/upload" className="text-center">
            Upload an Image
          </PrimaryButton>
          <Link
            href="#how-it-works"
            className="text-center text-[14.5px] font-bold text-graphite md:border-b md:border-graphite md:pb-0.5 md:text-[15px]"
          >
            See how it works
          </Link>
        </div>
      </div>

      <HeroPreviewPanel />
    </section>
  );
}
