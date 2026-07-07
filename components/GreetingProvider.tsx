"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GreetingAnimation from "@/components/GreetingAnimation";

export function GreetingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showGreeting, setShowGreeting] = useState<boolean | null>(null);

  useEffect(() => {
    const isHome = pathname === "/";

    const navEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;

    const isReload = navEntry?.type === "reload";

    // Marker unique to *this* document load (performance.timeOrigin changes
    // on every real navigation/reload, but not on client-side route changes).
    // Consumed immediately regardless of which page we're on, so a reload of
    // a non-Home page doesn't leave the load "unhandled" for Home to
    // mistakenly pick up later after a client-side navigation.
    const loadId = String(performance.timeOrigin);
    const handledLoadId = sessionStorage.getItem("reloadHandledFor");
    const isUnhandledReload = isReload && handledLoadId !== loadId;
    if (isUnhandledReload) {
      sessionStorage.setItem("reloadHandledFor", loadId);
    }

    // Not on the Home page: never show the greeting, on reload or otherwise.
    if (!isHome) {
      // Ensure a later client-side navigation to Home in this session is
      // treated as "returning", not a fresh first visit.
      sessionStorage.setItem("hasSeenGreeting", "true");
      setShowGreeting(false);
      return;
    }

    const hasSeen = sessionStorage.getItem("hasSeenGreeting");

    if (isUnhandledReload || !hasSeen) {
      setShowGreeting(true);
    } else {
      setShowGreeting(false);
    }
  }, [pathname]);

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
      {/*
        Previously this div always rendered `children` and only toggled CSS
        `visibility`, which meant HeroSection (deep inside children) mounted
        immediately and its mount-triggered entrance animation played out
        — invisibly — while the greeting was still showing. By the time the
        greeting finished and visibility flipped to "visible", Hero's
        animation had already completed, so nothing appeared to happen.

        Now children are not mounted into the DOM at all while the greeting
        is showing. They only mount the moment `showGreeting` becomes false
        — i.e. exactly when the greeting finishes (via handleFinish) or,
        for a returning visit, on the very first render. That means
        HeroSection's own `initial="hidden" / animate="visible"` mount
        animation now genuinely starts at the right moment: right as the
        greeting lifts away, not hidden behind it.
      */}
      {!showGreeting && <div aria-hidden="false">{children}</div>}
    </>
  );
}