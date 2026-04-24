"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import SignatureWorks from "@/components/SignatureWorks";
import GreetingAnimation from "@/components/GreetingAnimation";
import CloudyLogoReveal from "@/components/CloudyLogoReveal";
import QuoteSection from "@/components/QuoteSection";

export default function HomePage() {
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited");

    if (!hasVisited) {
      setShowGreeting(true);
      sessionStorage.setItem("hasVisited", "true");
    }
  }, []);

  return (
    <>
      {/* MAIN PAGE CONTENT */}
      <main className="relative">
        <div className="grid-background">
          <HeroSection />
        </div>

        <div className="bg-black">
          <CloudyLogoReveal />
        </div>
        
        <QuoteSection />
        
        <div className="grid-background">
          <SignatureWorks />
        </div>
      </main>
     

      {/* GREETING OVERLAY (OUTSIDE LAYOUT FLOW)  */}
      {showGreeting && (
        <GreetingAnimation onFinish={() => setShowGreeting(false)} />
      )}
    </>
  );
}
