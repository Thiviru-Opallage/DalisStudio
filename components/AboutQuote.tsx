"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from "framer-motion";
import { sfPro } from "@/lib/fonts";

const bracketImages = {
  one: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
  two: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop",
  three: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop",
};

interface StaticBracketProps {
  imgSrc: string;
}

// Mirrors the exact bracket markup/sizing ratios used by the
// HorizontalInlineCarousel in QuoteSection.tsx, just without the
// animated cycling (a single static image instead of an interval-driven set).
const StaticBracketImage: React.FC<StaticBracketProps> = ({ imgSrc }) => {
  return (
    <span className="inline-flex items-center mx-0.5 sm:mx-1 relative select-none">
      {/* Opening Bracket */}
      <span style={{ marginLeft: "-0.2em", position: "relative", top: "-0.08em", color: "var(--fg)" }} className="text-[0.9em] font-light select-none">(</span>

      {/* Image Container Box (Square & Em-based for perfect responsiveness) */}
      <span
        className="relative inline-block overflow-hidden bg-zinc-900 rounded-sm align-middle"
        style={{ width: "0.77em", height: "0.77em", top: "0.04em" }}
      >
        <Image
          src={imgSrc}
          alt="Curated Portfolio Feature"
          fill
          sizes="20vw"
          className="object-cover"
        />
      </span>

      {/* Closing Bracket */}
      <span style={{ marginRight: "-0.06em", position: "relative", top: "-0.08em", color: "var(--fg)" }} className="text-[0.9em] font-light select-none">)</span>
    </span>
  );
};

// Splits a string into words, each wrapped in a masked span so it can
// rise up from below its own clipped container ("mask reveal" style).
// Includes horizontal breathing room (pr/-mr) to prevent wide/tight-tracked
// glyphs at the end of a word from being clipped by the mask.
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

// ---------------------------------------------------------------------
// Entrance animation for Part 1's typographic quote block — identical
// timing/easing to QuoteSection.tsx's row-reveal treatment.
// ---------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.32,
      delayChildren: 0.2,
    },
  },
};

const lineVariants = {
  hidden: {
    y: "100%",
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function AboutQuote() {
  const [images, setImages] = useState(bracketImages);

  useEffect(() => {
    fetch("/api/content/about-quote")
      .then(res => res.json())
      .then(data => {
        if (data && data.one && data.two && data.three) {
          setImages(data);
        }
      })
      .catch(err => console.error("Failed to fetch about quote images", err));
  }, []);

  return (
    <section className="w-full px-4 md:px-8 font-sans select-none antialiased" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <div className="max-w-[1400px] w-full mx-auto flex flex-col">

        {/* ========================================================= */}
        {/* PART 1: THE CENTERED, DOWN-SCALED QUOTE SECTION          */}
        {/* Layout/structure copied 1:1 from QuoteSection.tsx's       */}
        {/* HeroSection typographic block, just rendered at a smaller */}
        {/* font-size to produce the minimized look.                  */}
        {/* ========================================================= */}
        <div className="relative pt-8 pb-8 mt-1 md:pt-12 md:pb-10 md:mt-6">
          <div className="flex flex-col items-center">
            <motion.h2
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className={
              `${sfPro.className}
              text-[10vw]
              sm:text-[6vw]
              md:text-[5vw]
              lg:text-[6vw]
              font-bold
              tracking-[0.0em]
              leading-[0.86]
              uppercase
              select-none
              text-center`
            }>

              {/* Row 1 */}
              <div className="overflow-hidden block whitespace-nowrap" style={{ marginTop: "0px" }}>
                <motion.div variants={lineVariants} className="block origin-left">
                  CREATE
                </motion.div>
              </div>

              {/* Row 2 */}
              <div className="overflow-hidden text-center whitespace-nowrap ml-[32px] sm:ml-[80px]" style={{ marginTop: "2px" }}>
                <motion.div variants={lineVariants} className="inline-block origin-left">
                  <span style={{ marginRight: "0.15em" }}>THE KIND</span>
                  <StaticBracketImage imgSrc={images.one} />
                  <span
                    style={{
                      marginLeft: "0.02em",
                      position: "relative",
                      top: "-0.10em",
                      fontSize: "0.75em",
                    }}
                  >
                    *
                  </span>
                </motion.div>
              </div>

              {/* Row 3 */}
              <div className="overflow-hidden flex items-center justify-center w-full" style={{ marginTop: "2px" }}>
                <motion.div variants={lineVariants} className="inline-block origin-left">
                  <span>OF WORK THAT</span>
                </motion.div>
              </div>

              {/* Row 4 */}
              <div className="overflow-hidden flex items-center justify-center w-full" style={{ marginTop: "2px" }}>
                <motion.div variants={lineVariants} className="inline-block origin-left">
                  <StaticBracketImage imgSrc={images.two} />
                  <span>THAT LINGERS</span>
                </motion.div>
              </div>

              {/* Row 5 — clipping is temporary (see note): stays masked
                  only while this row is rising, then releases to
                  overflow: visible the instant it settles, so the period
                  (offset below baseline by design) is never clipped by
                  this wrapper OR by any ancestor's own overflow boundary
                  once the animation completes. */}
              <motion.div
                className="flex items-center justify-center w-full"
                style={{ marginTop: "2px" }}
                variants={{
                  hidden: { overflow: "hidden" },
                  visible: {
                    overflow: "visible",
                    transition: { delay: 1.6, duration: 0 },
                  },
                }}
              >
                <motion.div variants={lineVariants} className="inline-block origin-left">
                  <StaticBracketImage imgSrc={images.three} />
                  <span
                    className="normal-case"
                    style={{
                      marginLeft: "-0.06em",
                      position: "relative",
                      top: "0.04em",
                      left: "-0.01em",
                    }}
                  >
                    .
                  </span>
                </motion.div>
              </motion.div>

            </motion.h2>

            {/* Chevron: sits directly beneath the text block, aligned to
                its right edge. Links to the QuoteSection specifically on
                the home page (not the Hero section) via its anchor id. */}
            <div className="w-full flex justify-end mt-3">
              <Link href="/#quote-section" aria-label="Navigate to Quote Section on Home">
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 hover:text-gray-400 transition-colors duration-200 cursor-pointer animate-bounce" style={{ color: "var(--fg)" }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Crisp White Divider Line splitting the sections */}
        <hr className="border-t opacity-100 w-full my-0" style={{ borderColor: "var(--fg)" }} />

        {/* ========================================================= */}
        {/* PART 2: THE COLLABORATE BLOCK (STAYS LEFT-ALIGNED)        */}
        {/* ========================================================= */}
        <div className="w-full pt-6 pb-12 md:pt-12 md:pb-20 flex flex-col gap-4 text-left">
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
            <MaskRevealText text="Lets Collaborate" stagger={0.06} amount={0.5} />
          </h3>

          <p className="text-sm md:text-base opacity-90 leading-normal font-normal max-w-xl" style={{ color: "var(--fg)" }}>
            <MaskRevealText
              text="Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi"
              stagger={0.02}
              delay={0.2}
              amount={0.3}
            />
          </p>
        </div>

      </div>
    </section>
  );
}