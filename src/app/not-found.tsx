import { Logo } from "@/components/ui/logo";
import { PrimaryButton } from "@/components/ui/primary-button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center px-[18px] py-16 text-center md:px-8">
      <Logo className="mb-10" />
      <p className="mb-2 font-mono text-xs tracking-wide text-text-secondary">
        404
      </p>
      <h1 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-graphite md:text-[32px]">
        Page not found
      </h1>
      <p className="mb-8 max-w-[420px] text-[15px] text-text-secondary">
        We couldn&apos;t find that page. It may have been moved, or the link may
        be broken.
      </p>
      <PrimaryButton href="/upload">Go to Upload</PrimaryButton>
    </main>
  );
}
