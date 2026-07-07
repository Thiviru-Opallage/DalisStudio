"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// Splits a string into words, each wrapped in a masked span so it can
// rise up from below its own clipped container ("mask reveal" style).
function MaskRevealText({
  text,
  className = "",
  stagger = 0.03,
  delay = 0,
  once = true,
  amount = 0.3,
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, amount });

  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-top pb-[0.15em] -mb-[0.15em] pr-[0.06em] -mr-[0.06em]"
        >
          <motion.span
            className="inline-block will-change-transform pr-[0.02em]"
            initial={{ y: "110%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + i * stagger,
            }}
          >
            {word}
            {i !== words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function AboutText() {
  const sectionRef = useRef<HTMLElement>(null);

  // Tracks this section's own scroll progress independently of the
  // mask-reveal-on-view logic above (which only fires once). This is
  // purely for the parallax drift while the section scrolls past.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Heading and paragraph drift at different rates as the page scrolls,
  // matching the reference's layered-depth feel (foreground text moves
  // faster than background elements). Kept subtle since this is body
  // copy, not a hero visual.
  const headingY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);
  const paragraphY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section ref={sectionRef} className="w-full pt-0 md:pt-12 pb-6 px-4 md:px-6 font-sans select-none" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <div className="w-full flex flex-col gap-4 text-left">
        {/* Main Heading */}
        <motion.h1 style={{ y: headingY }} className="text-7xl md:text-[140px] font-extrabold tracking-tighter leading-none">
          <MaskRevealText text="About Me" stagger={0.06} amount={0.5} />
        </motion.h1>

        {/* Description Paragraph */}
        <motion.p style={{ y: paragraphY, color: "var(--fg)" }} className="text-lg md:text-[18px] leading-[1.7] font-normal max-w-2xl antialiased">
          <MaskRevealText
            text="Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud"
            stagger={0.012}
            delay={0.25}
            amount={0.3}
          />
        </motion.p>
      </div>
    </section>
  );
}