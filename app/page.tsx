"use client";

import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import ScrollRevealSection from "@/components/ScrollRevealSection";

const SignatureWorks = dynamic(() => import("@/components/SignatureWorks"));
const QuoteSection = dynamic(() => import("@/components/QuoteSection"));

export default function HomePage() {
  return (
    <>
      {/* MAIN PAGE CONTENT */}
      <main className="relative">
        {/* Hero is the first thing visible on load — keep its settle very
            subtle so it doesn't fight the WebGL liquid mask already doing
            work here. */}
        <ScrollRevealSection intensity={0.4} maxBlur={5}>
          <HeroSection />
        </ScrollRevealSection>

        <ScrollRevealSection intensity={0.85}>
          <QuoteSection />
        </ScrollRevealSection>

        <ScrollRevealSection intensity={1}>
          <SignatureWorks />
        </ScrollRevealSection>
      </main>
    </>
  );
}