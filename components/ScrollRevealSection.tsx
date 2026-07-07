"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Overall strength of the effect (0 = no effect, 1 = full effect).
   * Defaults to 1.
   */
  intensity?: number;
  /**
   * How far the section shifts vertically at full intensity while entering
   * / exiting, in px. Defaults to 22.
   */
  riseDistance?: number;
  /**
   * Max blur (px) applied at the very edges of the section's transit
   * (just entering / about to exit), settling to 0 while comfortably in
   * view. Defaults to 8.
   */
  maxBlur?: number;
}

/**
 * ScrollRevealSection
 * --------------------
 * A continuous, direction-symmetric scroll effect (not a one-shot
 * "reveal on enter" animation). Motion is driven by the section's entire
 * transit through the viewport, in three phases:
 *
 *   entering (below the fold) -> settled (comfortably in view) -> exiting (above the fold)
 *        blurred/offset       ->      sharp/still               ->   blurred/offset
 *
 * Because the same continuous scrollYProgress range covers the WHOLE
 * transit (not just the leading edge), the effect is automatically
 * reversible and symmetric:
 *   - Scrolling down (hero -> footer): each section sharpens in as it
 *     arrives, then blurs/lifts out as it leaves toward the top.
 *   - Scrolling up (footer -> hero): the exact same curve plays in
 *     reverse, since it's driven by scroll position, not a one-time
 *     mount/enter trigger.
 *
 * This fixes the earlier version's asymmetry, which only defined a
 * transform for the entrance half of the transit — once a section was
 * comfortably in view it stayed pinned at "fully settled" with no exit
 * transform at all, so scrolling further down out of it showed no motion.
 *
 * No colour, background, or clip-path is touched anywhere — opacity,
 * translateY, and blur all work identically in both themes with zero
 * contrast dependency, which also avoids the earlier white-flash issue.
 *
 * Section height/layout is completely untouched — no wrapper height, no
 * sticky positioning, no added scroll distance.
 *
 * Usage:
 *   <ScrollRevealSection><HeroSection /></ScrollRevealSection>
 */
export default function ScrollRevealSection({
  children,
  className = "",
  style,
  intensity = 1,
  riseDistance = 22,
  maxBlur = 8,
}: ScrollRevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Covers the section's ENTIRE transit through the viewport: progress 0
  // when its top is at the bottom of the viewport (about to enter), 0.5
  // when it's centred, 1 when its bottom has reached the top of the
  // viewport (about to exit). This single continuous range is what makes
  // the effect symmetric in both scroll directions.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const clamped = Math.max(0, Math.min(1, intensity));

  // Three-phase curves: edge -> settled -> edge, mirrored around the
  // midpoint so entering and exiting look like inverses of each other.
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    [1 - clamped, 1, 1, 1 - clamped]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    [
      `${riseDistance * clamped}px`,
      "0px",
      "0px",
      `${-riseDistance * clamped}px`,
    ]
  );

  const blurPx = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    [maxBlur * clamped, 0, 0, maxBlur * clamped]
  );
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        // Blur can visually bleed a few px past the element's own box.
        // Without an explicit theme-aware background here, that bleed can
        // reveal whatever sits behind it — in this layout that's the
        // transparent <body>, which falls through to browser-default white
        // regardless of dark mode. Painting var(--bg) here guarantees the
        // bleed always shows the correct theme colour, never a stray white.
        background: "var(--bg)",
        ...style,
      }}
    >
      <motion.div
        style={{
          opacity,
          y,
          filter,
          width: "100%",
          height: "100%",
          willChange: "transform, opacity, filter",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}