"use client";

import AboutHero from "@/components/AboutHero";
import AboutText from "@/components/AboutText";
import AboutQuote from "@/components/AboutQuote";

export default function AboutPage() {
  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
        {/* SECTION 1: Dynamic Geometric Mask Hero Frame */}
        <AboutHero />

        {/* SECTION 2: Textual Biography and Artistic Statement */}
        <AboutText />

        {/* SECTION 3: (To be appended next) */}
        <AboutQuote />
      </main>
    </>
  );
}