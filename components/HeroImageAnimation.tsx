"use client";

import Image from "next/image";

export default function StaticHeroImage() {
  return (
    <div
      className="
        relative
        w-[520px]
        h-[760px]
        md:w-[620px]
        md:h-[860px]
      "
    >
      <Image
        src="/me.png"
        alt="Dalis Studio Portrait"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}
