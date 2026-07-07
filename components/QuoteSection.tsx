"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { sfPro } from "@/lib/fonts";

// Grouping your 9 artworks into 3 separate collections (3 images per bracket)
const bracketOneImages = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", // Work 1
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop", // Work 2
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop", // Work 3
];

const bracketTwoImages = [
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop", // Work 4
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&auto=format&fit=crop", // Work 5
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop", // Work 6
];

const bracketThreeImages = [
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop", // Work 7
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop", // Work 8
  "https://images.unsplash.com/photo-1526758097130-bab247274f58?q=80&w=600&auto=format&fit=crop", // Work 9 (replaced broken link)
];

interface InlineCarouselProps {
  images: string[];
  intervalTime: number;
}

// Reusable Horizontal Inline Carousel Component
const HorizontalInlineCarousel: React.FC<InlineCarouselProps> = ({ images, intervalTime }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [images.length, intervalTime]);

  return (
    <span className="inline-flex items-center mx-0.5 sm:mx-1 relative select-none">
      {/* Opening Bracket */}
      <span style={{ marginLeft: "-0.2em", position: "relative", top: "-0.08em", color: "var(--fg)" }} className="text-[0.9em] font-light select-none">(</span>
      
      {/* Image Container Box (Square & Em-based for perfect responsiveness) */}
      <span 
        className="relative inline-block overflow-hidden bg-zinc-900 rounded-sm align-middle"
        style={{ width: "0.77em", height: "0.77em", top: "0.04em" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            className="w-full h-full absolute inset-0"
            // Changed from vertical (y) to horizontal (x) translation
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ 
              duration: 0.65, 
              ease: [0.25, 1, 0.5, 1] // Clean, premium ease-out curve
            }}
          >
            <Image
              src={images[index]}
              alt="Designer Portfolio Piece"
              fill
              sizes="20vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </span>

      {/* Closing Bracket */}
      <span style={{ marginRight: "-0.06em", position: "relative", top: "-0.08em", color: "var(--fg)" }} className="text-[0.9em] font-light select-none">)</span>
    </span>
  );
};

// Container variants — orchestrates the stagger across the 5 rows, same
// timing pattern as EcommerceHeading's containerVariants, slowed down so
// each row has more breathing room before the next one starts.
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

// Per-row variants — same motion language as EcommerceHeading's
// lineVariants (slides up from behind its own overflow-hidden mask, with a
// fade and a slight scale-up settle), just stretched out to a slower,
// more deliberate pace.
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

export default function HeroSection() {
  const [images, setImages] = useState({
    bracketOne: bracketOneImages,
    bracketTwo: bracketTwoImages,
    bracketThree: bracketThreeImages,
  });

  useEffect(() => {
    fetch("/api/content/quote-brackets")
      .then(res => res.json())
      .then(data => {
        if (data && data.bracketOne && data.bracketTwo && data.bracketThree) {
          setImages(data);
        }
      })
      .catch(err => console.error("Failed to fetch quote brackets", err));
  }, []);

  return (
    <section id="quote-section" className="min-h-[auto] pt-12 py-10 lg:min-h-screen lg:py-0 flex flex-col justify-center items-center px-4 md:px-8 overflow-hidden pt-0 lg:pt-20" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <div className="max-w-[1400px] w-full mx-auto text-center">
        
        {/* Typographic Hero Layout */}
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className=
          {`${sfPro.className} 
          text-[11vw]
          sm:text-[9.5vw] 
          md:text-[8.5vw] 
          lg:text-[9vw] 
          font-bold 
          tracking-[0.0em] 
          leading-[0.86] 
          uppercase 
          select-none`}
        >
          
          {/* Row 1 */}
          <div className="overflow-hidden block whitespace-nowrap" style={{ marginTop: "0px" }}>
            <motion.div variants={lineVariants} className="block origin-left">
              CREATE
            </motion.div>
          </div>

          {/* Row 2 */}
          <div className="overflow-hidden text-center whitespace-nowrap ml-8.5 lg:ml-[115px]" style={{ marginTop: "2px" }}>
            <motion.div variants={lineVariants} className="inline-block origin-left">
              <span style={{ marginRight: "0.15em" }}>THE KIND</span>
              {/* Carousel 1: Fast but highly readable pacing (2.2 seconds) */}
              <HorizontalInlineCarousel images={images.bracketOne} intervalTime={2200} />
              <span 
              style={{
                marginLeft: "0.02em",
                position: "relative",
                top: "-0.10em",
                fontSize: "0.75em",
              }}>
                *
              </span>
            </motion.div>
          </div>

          {/* Row 3 */}
          <div className="overflow-hidden block text-center whitespace-nowrap" style={{ marginTop: "2px" }}>
            <motion.div variants={lineVariants} className="inline-block origin-left">
              <span>OF WORK THAT</span>
            </motion.div>
          </div>

          {/* Row 4 */}
          <div className="overflow-hidden block text-center whitespace-nowrap" style={{ marginTop: "2px" }}>
            <motion.div variants={lineVariants} className="inline-block origin-left">
              {/* Carousel 2: Slower, standard showcase pacing (3.8 seconds) */}
              <HorizontalInlineCarousel images={images.bracketTwo} intervalTime={3800} />
              <span>THAT LINGERS</span>
            </motion.div>
          </div>

          {/* Row 5 */}
          <motion.div
            className="block text-center whitespace-nowrap"
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
              {/* Carousel 3: Matches Carousel 1 pacing (2.2 seconds) */}
              <HorizontalInlineCarousel images={images.bracketThree} intervalTime={2200} />
              <span className="normal-case" style={{ 
                marginLeft: "-0.06em" ,
                position: "relative",
                top: "0.04em",
                left: "-0.01em",
                }}>
                  .
              </span>
            </motion.div>
          </motion.div>

        </motion.h1>

      </div>
    </section>
  );
}