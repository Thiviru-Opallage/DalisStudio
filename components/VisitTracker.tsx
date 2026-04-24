"use client";

import { useTrackVisit } from "@/lib/useTrackVisit";

export default function VisitTracker() {
  useTrackVisit();
  return null; // renders nothing
}