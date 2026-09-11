import { PrimaryButton } from "@/components/ui/primary-button";

export function FinalCtaSection() {
  return (
    <section
      id="about"
      className="bg-graphite px-[18px] py-14 text-center md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-[700px]">
        <h2 className="mb-3 font-display text-[26px] leading-[1.1] font-black tracking-tight text-white md:mb-4 md:text-[clamp(28px,3.6vw,40px)]">
          Inspect your first image.
        </h2>
        <p className="mb-6 text-[14.5px] text-[#8A9497] md:mb-8 md:text-base">
          Free, no account. Your file is removed once processing finishes.
        </p>
        <PrimaryButton href="/upload">Upload an Image</PrimaryButton>
      </div>
    </section>
  );
}
