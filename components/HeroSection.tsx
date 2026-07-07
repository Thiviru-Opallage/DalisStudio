"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sfPro } from "@/lib/fonts";
import LiquidMaskHoverReveal from "./LiquidMaskHoverReveal";
import ThemeSwitch from "./ThemeSwitch";

// Hero section with liquid mask WebGL effect, theme toggle, and a
// PremiumLanding-style entrance animation (clip-path/scale/fade on the
// whole section, then a staggered rise-in for the headline + toggle).
//
// This entrance is intentionally NOT gated behind sessionStorage/localStorage
// the way GreetingAnimation is — it's meant to play every time this
// component mounts, including plain client-side navigation back to Home
// from another page, not just on a fresh page load.

const ease = [0.14, 1, 0.34, 1] as const;

const sectionOuterVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 90,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1.2, ease },
  },
};

const clipLayerVariants = {
  hidden: {
    // Bottom-weighted inset (24% bottom vs 8% top) so the frame itself
    // reads as anchored to the bottom edge rather than a centered zoom —
    // combined with the outer layer's y offset, this is what makes the
    // section genuinely look like it's rising up from behind the bottom
    // of the screen, instead of growing outward from the middle.
    clipPath: "inset(8% 15% 24% 15% round 32px)",
  },
  visible: {
    clipPath: "inset(0% 0% 0% 0% round 0px)",
    transition: { duration: 1.2, ease },
  },
};

const contentContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.45 },
  },
};

const contentItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

export default function HeroSection() {
  const [data, setData] = useState({
    title: "Dalis Studio",
    base_image: "/hero-base.jpg",
    hover_image: "/hero-hover.jpg"
  });

  useEffect(() => {
    fetch("/api/content/hero")
      .then(res => res.json())
      .then(d => {
        if (d && d.base_image && d.hover_image) {
          setData(d);
        }
      })
      .catch(err => console.error("Failed to fetch hero content", err));
  }, []);

  return (
    <motion.section
      variants={sectionOuterVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ background: "var(--bg)" }}
    >
      {/* Isolated clip-path layer: promoted to its own composited layer
          (translateZ(0) + will-change) so the browser can repaint this
          layer's clip-path animation independently of the WebGL canvas's
          own render loop inside it, instead of both competing for the
          same paint pass every frame — that contention was the actual
          cause of the mid-animation stall/stutter. */}
      <motion.div
        variants={clipLayerVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 w-full h-full"
        style={{ transform: "translateZ(0)", willChange: "clip-path" }}
      >
        {/* Liquid mask WebGL layer */}
        <LiquidMaskHoverReveal
          key={data.base_image + data.hover_image}
          imageBase={{
            src: data.base_image,
            alt: "Dalis Studio Hero Background",
            positionY: "20%",
          }}
          imageHover={{
            src: data.hover_image,
            alt: "Dalis Studio Hero Reveal",
            positionY: "20%",
          }}
          radius={100}
          curl={30}
          texture={0.7}
          parallaxAmount={100}
          shrinkTimeSeconds={2.4}
        />

        {/* Bottom gradient — keeps text legible over the photo */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 30%, transparent 52%)",
          }}
        />
      </motion.div>

      {/* Staggered content: headline + toggle rise in after the section's
          own clip/scale/fade has started settling. */}
      <motion.div
        variants={contentContainerVariants}
        initial="hidden"
        animate="visible"
        className="contents"
      >
        {/* "Dalis Studio®" headline */}
        <motion.div
          variants={contentItemVariants}
          className="absolute bottom-0 left-0 w-full pointer-events-none z-20 overflow-visible"
        >
          <h1
            className={`${sfPro.className} font-black leading-none whitespace-nowrap text-[3.6rem] sm:text-[5rem] lg:text-[12.355rem]`}
            style={{
              color: "#ffffff",
              letterSpacing: "-0.06em",
              lineHeight: 0.75,
              marginLeft: "-0.02em",
            }}
          >
            {data.title}
            <sup
              className="text-[0.16em] lg:text-[0.18em]"
              style={{
                marginLeft: "-0.55em",
                position: "relative",
                top: "-0.75em",
                fontWeight: "normal",
                fontFamily:
                  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                display: "inline-block",
                verticalAlign: "super",
                fontVariantNumeric: "normal",
                fontStretch: "normal",
                fontStyle: "normal",
              }}
            >
              ®
            </sup>
          </h1>
        </motion.div>

        {/* Theme toggle pill */}
        <motion.div
          variants={contentItemVariants}
          className="absolute z-30 bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-[-1.5rem] lg:right-[20rem]"
        >
          <ThemeSwitch />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}