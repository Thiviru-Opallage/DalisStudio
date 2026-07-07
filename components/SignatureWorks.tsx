"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from "next/image";

const works = [
  {
    src: "/neonMirage.jpg",
    title: "Our Approach",
    description: "A systems-driven creative methodology focused on clarity, intent, and precision.",
  },
  {
    src: "/echoesOfSilence.jpg",
    title: "Our Technology",
    description: "Modern stacks, motion systems, and performance-first engineering.",
  },
  {
    src: "/the-digital-renaissance.jpg",
    title: "Our Craft",
    description: "Every pixel refined, every transition intentional, every interaction weighted.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const headingVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.18 },
  },
};

const cardEntranceVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease },
  },
};

// Overlay variants — the full-screen dark backdrop
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit:   { opacity: 0, transition: { duration: 0.3,  ease: "easeIn" as const, delay: 0.15 } },
};

// The expanded card panel slides up from its origin
const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 30,
    transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] as [number,number,number,number] },
  },
};

// Helper: returns motion props for staggered fade-up inside the expanded panel
function fadeUp(delay: number) {
  return {
    initial:    { opacity: 0, y: 18 },
    animate:    { opacity: 1, y: 0,  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number,number,number,number], delay } },
    exit:       { opacity: 0, y: -10, transition: { duration: 0.2 } },
  } as const;
}

export default function SignatureWorks() {
  const [active, setActive]   = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState(0);
  const [worksList, setWorksList] = useState<any[]>(works);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setExpanded(null);
  }, []);

  useEffect(() => {
    if (expanded !== null) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [expanded, handleKeyDown]);

  useEffect(() => {
    fetch("/api/content/signature-works")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => ({
            src: item.image_url,
            title: item.title,
            description: item.description,
          }));
          setWorksList(mapped);
        }
      })
      .catch(err => console.error("Failed to fetch signature works", err));
  }, []);

  // Opening a card now first scrolls the clicked card fully into view
  // (centered in the viewport), THEN expands it.
  //
  // Desktop: unchanged — a fixed 300ms delay works fine because the row
  // height is large (md:h-[70vh]), so the scroll distance to "center" is
  // short and the smooth-scroll reliably finishes inside 300ms.
  //
  // Mobile: rows are short and stacked (auto-rows-[220px], grid-cols-1),
  // so scrolling from a half-visible card to "centered" can be a much
  // longer distance — the smooth scroll can easily take 500-800ms+.
  // The old fixed 300ms fired the expand while the page was still
  // scrolling, which is what caused the "stuck"/snapping feel. Instead,
  // on mobile we detect when the scroll has actually settled (no scroll
  // position change for a couple of consecutive frames) before expanding.
  const openCard = (index: number, cardEl?: HTMLElement) => {
    if (!cardEl) {
      setExpanded(index);
      setActive(null);
      return;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (!isMobile) {
      // Desktop path — unchanged
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        setExpanded(index);
        setActive(null);
      }, 300);
      return;
    }

    // Mobile path — wait for scroll to actually settle before expanding
    cardEl.scrollIntoView({ behavior: "smooth", block: "center" });

    let lastY = window.scrollY;
    let stableFrames = 0;
    const maxWait = 1000; // hard safety cap in ms so a click never feels stuck
    const startTime = performance.now();

    const checkSettled = () => {
      const currentY = window.scrollY;
      const elapsed = performance.now() - startTime;

      if (currentY === lastY) {
        stableFrames++;
      } else {
        stableFrames = 0;
        lastY = currentY;
      }

      // Consider "settled" after ~3 consecutive stable frames (~50ms),
      // or bail out after maxWait so a click never feels unresponsive.
      if (stableFrames >= 3 || elapsed >= maxWait) {
        setExpanded(index);
        setActive(null);
        return;
      }

      requestAnimationFrame(checkSettled);
    };

    requestAnimationFrame(checkSettled);
  };

  const closeCard = () => setExpanded(null);

  const expandedWork = expanded !== null ? worksList[expanded] : null;

  return (
    <section
      className="relative w-full pt-8 pb-20 md:py-20 min-h-screen flex flex-col justify-center overflow-visible"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* MOBILE DIVIDER */}
      <div className="md:hidden absolute top-0 left-0 w-full h-px" style={{ background: "var(--fg)", opacity: 0.15 }} />

      <div className="relative max-w-[1400px] w-full mx-auto px-6 md:px-10 overflow-visible">

        {/* HEADING */}
        <motion.div
          className="flex items-end gap-6 md:gap-10 mb-10 md:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headingVariants}
          style={{ pointerEvents: "none" }}
        >
          <h2 className="shrink-0 leading-none">
            <span className="block text-[10px] md:text-[11px] font-medium uppercase tracking-[0.5em] mb-3" style={{ color: "var(--fg)", opacity: 0.4 }}>
              Recent
            </span>
            <span className="block text-3xl md:text-5xl font-bold uppercase tracking-tight" style={{ color: "var(--fg)" }}>
              Projects
            </span>
          </h2>
          <div className="h-px w-full mb-2 md:mb-3" style={{ background: "var(--fg)", opacity: 0.4 }} />
          <span className="block shrink-0 text-[11px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--fg)", opacity: 0.4 }}>
            {String(worksList.length).padStart(2, "0")}
          </span>
        </motion.div>

        {/* CARD GRID */}
        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[220px] md:auto-rows-auto md:h-[70vh] w-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={gridVariants}
        >
          {worksList.map((work, index) => {
            const isActive = active === index;

            const gridConfig = [
              "md:col-span-4",
              "md:col-span-4",
              "md:col-span-4",
            ];

            return (
              <motion.div
                key={index}
                variants={cardEntranceVariants}
                className={gridConfig[index]}
              >
                <motion.div
                  className="relative h-full rounded-[2rem] overflow-hidden cursor-pointer group z-10"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCursorY(e.clientY - rect.top);
                  }}
                  onClick={(e) => openCard(index, e.currentTarget)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* BACKGROUND IMAGE */}
                  <div className="absolute inset-0">
                    <Image
                      src={work.src}
                      alt={work.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={`object-cover transition-transform duration-700 ${
                        isActive ? "scale-110" : "scale-100"
                      }`}
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                  </div>

                  {/* VERTICAL TITLE */}
                  <div className="absolute left-7 md:left-9 bottom-6 md:bottom-12 origin-bottom-left -rotate-90 whitespace-nowrap">
                    <h3 className="text-white text-[10px] md:text-base tracking-[0.25em] md:tracking-[0.3em] font-bold uppercase">
                      {work.title}
                    </h3>
                  </div>

                  {/* "TAP TO OPEN" hint on hover */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white/70 text-[10px] uppercase tracking-[0.3em] font-medium">
                      View
                    </span>
                  </motion.div>

                  {/* CURSOR ASTERISK */}
                  {isActive && (
                    <motion.div
                      className="absolute left-10 text-white text-2xl pointer-events-none z-20"
                      animate={{ top: cursorY }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      ✳
                    </motion.div>
                  )}

                  {/* VISUAL LAYOUT LINES */}
                  {index < 2 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/10" />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ─── EXPANDED CARD OVERLAY (portal-style, fixed to viewport) ─────────── */}
      {mounted && createPortal(
        <AnimatePresence>
          {expandedWork && (
            <>
              {/* Backdrop — click to close */}
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={closeCard}
                aria-label="Close"
              />

              {/* Panel */}
              <motion.div
                key="panel"
                className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-10 pointer-events-none"
              >
                <motion.div
                  className="relative w-full max-w-5xl h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto"
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Full image */}
                  <Image
                    src={expandedWork.src}
                    alt={expandedWork.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                    priority
                  />

                  {/* Dark gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                  {/* ESC hint */}
                  <motion.span
                    {...fadeUp(0.18)}
                    className="absolute top-6 left-6 z-20 text-[10px] uppercase tracking-[0.3em] text-white/40 hidden md:block"
                  >
                    esc to close
                  </motion.span>

                  {/* Content — bottom of panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                    <motion.p
                      {...fadeUp(0.28)}
                      className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-white/50 mb-3"
                    >
                      {String((expanded ?? 0) + 1).padStart(2, "0")} / {String(worksList.length).padStart(2, "0")}
                    </motion.p>

                    <motion.h2
                      {...fadeUp(0.38)}
                      className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4"
                    >
                      {expandedWork.title}
                    </motion.h2>

                    <motion.p
                      {...fadeUp(0.48)}
                      className="text-base md:text-xl text-white/70 leading-relaxed max-w-2xl mb-8"
                    >
                      {expandedWork.description}
                    </motion.p>

                    <motion.button
                      {...fadeUp(0.56)}
                      onClick={closeCard}
                      className="inline-flex items-center gap-3 text-xs uppercase tracking-widest border border-white/30 px-7 py-3 rounded-full text-white hover:bg-white hover:text-black transition-colors duration-200"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}