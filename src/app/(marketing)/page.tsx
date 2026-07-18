import { HeroSection } from "@/components/landing/hero-section";
import { AudienceStrip } from "@/components/landing/audience-strip";
import { ValuePropositionSection } from "@/components/landing/value-proposition-section";
import { PlatformSection } from "@/components/landing/platform-section";
import { ModularFeaturesSection } from "@/components/landing/modular-features-section";
import { GamificationSection } from "@/components/landing/gamification-section";
import { MobileAppSection } from "@/components/landing/mobile-app-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { AnalyticsSection } from "@/components/landing/analytics-section";
import { ModularJourneySection } from "@/components/landing/modular-journey-section";
import { PlansSection } from "@/components/landing/plans-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AudienceStrip />
      <ValuePropositionSection />
      <PlatformSection />
      <ModularFeaturesSection />
      <GamificationSection />
      <MobileAppSection />
      <UseCasesSection />
      <AnalyticsSection />
      <ModularJourneySection />
      <PlansSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
