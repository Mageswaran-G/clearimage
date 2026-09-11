import { LandingHeader } from "@/components/landing/landing-header";
import { Hero } from "@/components/landing/hero";
import { TechnicalInfoStrip } from "@/components/landing/technical-info-strip";
import { CapabilitiesSection } from "@/components/landing/capabilities-section";
import { ImageInspectionSection } from "@/components/landing/image-inspection-section";
import { BeforeAfterSection } from "@/components/landing/before-after-section";
import { ProvenanceIntelligenceSection } from "@/components/landing/provenance-intelligence-section";
import { PrivacySection } from "@/components/landing/privacy-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main id="top">
        <Hero />
        <TechnicalInfoStrip />
        <CapabilitiesSection />
        <ImageInspectionSection />
        <BeforeAfterSection />
        <ProvenanceIntelligenceSection />
        <PrivacySection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
