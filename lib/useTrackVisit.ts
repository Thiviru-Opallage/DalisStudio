"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useTrackVisit() {
  const pathname    = usePathname();
  const visitId     = useRef<string | null>(null);
  const startTime   = useRef<number>(Date.now());
  const pageCount   = useRef<number>(0);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    pageCount.current += 1;
    startTime.current  = Date.now();

    fetch("/api/track-visit", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ page_path: pathname }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.visitId) visitId.current = data.visitId;
      })
      .catch(() => {});

    // On unmount / page change — send session end signal
    return () => {
      if (!visitId.current) return;
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const isBounce = pageCount.current <= 1;
      navigator.sendBeacon(
        "/api/track-visit/end",
        JSON.stringify({ visitId: visitId.current, duration, isBounce })
      );
    };
  }, [pathname]);
}