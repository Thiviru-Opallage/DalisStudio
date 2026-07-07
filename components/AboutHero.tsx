"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function AboutHero() {
  const { dark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState({
    base_image_dark: "/about-hero-face.png",
    hover_image_dark: "/about-colour.png",
    base_image_light: "/about-hero-face-light.png",
    hover_image_light: "/about-colour-light.png"
  });

  useEffect(() => {
    fetch("/api/content/about-hero")
      .then(res => res.json())
      .then(data => {
        if (data && data.base_image_dark && data.hover_image_dark) {
          setImages(data);
        }
      })
      .catch(err => console.error("Failed to fetch about hero content", err));
  }, []);

  const baseImage  = dark ? images.base_image_dark  : images.base_image_light;
  const hoverImage = dark ? images.hover_image_dark : images.hover_image_light;

  // Tracks this section's own progress through the viewport as the page
  // scrolls past it (not tied to the entrance animation above, which only
  // plays once on mount). This is what drives the parallax drift on the
  // photography layer, matching the reference's slow-background-drift feel.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Background image layer drifts vertically at a slower, subtle rate
  // relative to the frame around it as the section scrolls past.
  const bgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div className="w-full sm:min-h-[92vh] p-0 sm:p-4 md:p-5 select-none" style={{ background: "var(--bg)" }}>
      {/* The Framed Canvas Window 
        Preserves the small screen gap and locks the rounded outer corners.
        Added 'group' to handle the hover trigger seamlessly.
        Mobile: full-bleed (no padding/rounding/border) so the image covers the whole screen.
        sm and up: identical to original framed look.
      */}
      <motion.div
        ref={containerRef}
        initial={{ clipPath: "inset(35% 35% 35% 35% round 24px)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
        transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative w-full aspect-[3/4] sm:aspect-auto sm:h-[88vh] md:h-[90vh] bg-zinc-950 rounded-none sm:rounded-[24px] overflow-hidden border-0 sm:border sm:border-neutral-900/60 shadow-2xl cursor-pointer will-change-transform"
      >
        
        {/* PHOTOGRAPHY LAYER */}
        <motion.div
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Inner drift wrapper: fixed overscan + scroll-linked y translate,
              kept separate from the entrance scale/transition above so the
              two animations (mount vs scroll) don't fight over the same
              transform/transition values. */}
          <motion.div
            style={{ y: bgY, scale: 1.08 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* BASE IMAGE: Grayscale / Default state */}
            <Image
              src={baseImage}
              alt="About Visual Portrait Grayscale"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center sm:scale-[1] sm:origin-bottom grayscale contrast-[1.18] brightness-[0.92]"
            />

            {/* HOVER IMAGE: Colored version that fades in on hover */}
            <Image
              src={hoverImage} 
              alt="About Visual Portrait Colored"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center sm:scale-[1] sm:origin-bottom opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
            />
          </motion.div>
        </motion.div>

        {/* Ambient Dark Overlay for added cinematic depth */}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none mix-blend-multiply" /> */}
      </motion.div>
    </div>
  );
}