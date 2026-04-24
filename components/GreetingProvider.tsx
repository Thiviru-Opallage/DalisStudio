"use client";

import { useEffect, useState } from "react";
import GreetingAnimation from "@/components/GreetingAnimation";

export function GreetingProvider({ children }: { children: React.ReactNode }) {
  const [showGreeting, setShowGreeting] = useState<boolean | null>(null);

  useEffect(() => {
    const navEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;

    const isReload = navEntry?.type === "reload";
    const hasSeen = sessionStorage.getItem("hasSeenGreeting");

    // Show greeting on reload OR first visit
    if (isReload || !hasSeen) {
      setShowGreeting(true);
    } else {
      setShowGreeting(false);
    }
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem("hasSeenGreeting", "true");
    setShowGreeting(false);
  };

  // Lock scroll while greeting is active
  useEffect(() => {
    if (showGreeting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showGreeting]);

  // ⛔ CRITICAL: do not render ANYTHING until decision is made
  if (showGreeting === null) {
    return null;
  }

  return (
    <>
      {showGreeting && <GreetingAnimation onFinish={handleFinish} />}
      {!showGreeting && children}
    </>
  );
}
