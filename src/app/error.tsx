"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error boundary. Catches unexpected render/runtime failures in any
 * page below the root layout. Never shows the raw error message or stack —
 * only a generic, user-safe description — since `error.message` can carry
 * internal details that don't belong on screen.
 */
export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center px-[18px] py-16 text-center md:px-8">
      <Logo className="mb-10" />
      <p className="mb-2 font-mono text-xs tracking-wide text-error">
        SOMETHING WENT WRONG
      </p>
      <h1 className="mb-3 font-display text-2xl font-extrabold tracking-tight text-graphite md:text-[32px]">
        We hit an unexpected error
      </h1>
      <p className="mb-8 max-w-[420px] text-[15px] text-text-secondary">
        Nothing was uploaded anywhere — everything stayed on this device. Try
        again, or head back to Upload.
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <PrimaryButton onClick={reset}>Try again</PrimaryButton>
        <SecondaryButton href="/upload">Go to Upload</SecondaryButton>
      </div>
    </main>
  );
}
