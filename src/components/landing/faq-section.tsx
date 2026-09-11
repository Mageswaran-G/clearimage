"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Is ClearImage really free?",
    a: "Yes. Core inspection and cleanup features are free to use, with no account required.",
  },
  {
    q: "What happens to my uploaded image?",
    a: "Your file is processed temporarily to perform analysis and cleanup, then removed. We do not build an image library from uploads.",
  },
  {
    q: "What file types are supported?",
    a: "JPG, JPEG, PNG, and WebP images are currently supported.",
  },
  {
    q: "What is provenance information?",
    a: "Signals — such as Content Credentials or embedded metadata — that can indicate how and where an image was created or edited.",
  },
  {
    q: "Will cleanup reduce image quality?",
    a: "Cleanup is designed to preserve resolution and quality; compare before and after before downloading.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-[760px] px-[18px] py-6 pb-11 md:px-8 md:pb-[110px]">
      <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-graphite md:mb-9 md:text-[30px]">
        Frequently asked
      </h2>
      <div>
        {FAQS.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div key={faq.q} className="border-b border-border">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 py-4 text-left font-sans md:py-5"
              >
                <span className="text-[14.5px] font-bold text-graphite md:text-[15.5px]">
                  {faq.q}
                </span>
                <span className="flex-none font-mono text-base text-text-secondary md:text-base">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && (
                <div className="max-w-[600px] pb-[18px] text-[13.5px] leading-relaxed text-text-secondary md:pb-[22px] md:text-[14.5px]">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
