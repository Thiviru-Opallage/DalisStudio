"use client";

import WorksGrid from "@/components/WorksGrid";

export default function WorksPage() {
  return (
    <main className="relative w-full bg-black overflow-x-hidden">
      {/* CALLING DALI STUDIO WORKS PRESENTATION GALLERY */}
      <WorksGrid />
    </main>
  );
}