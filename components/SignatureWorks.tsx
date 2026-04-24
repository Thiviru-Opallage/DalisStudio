"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const works = [
  {
    src: "/neonMirage.jpg",
    title: "Our Approach",
    description:
      "A systems-driven creative methodology focused on clarity, intent, and precision.",
  },
  {
    src: "/echoesOfSilence.jpg",
    title: "Our Technology",
    description:
      "Modern stacks, motion systems, and performance-first engineering.",
  },
  {
    src: "/the-digital-renaissance.jpg",
    title: "Our Craft",
    description:
      "Every pixel refined, every transition intentional, every interaction weighted.",
  },
  {
    src: "/neonMirage.jpg",
    title: "Our Vision",
    description:
      "Design that feels physical, emotional, and quietly confident.",
  },
];

export default function SignatureWorks() {
  const [active, setActive] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState(0);

  return (
    <section className="relative w-full pt-10 pb-32 ">
      {/* HEADER SECTION */}
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 mb-16 z-10 text-left">
        <h4 className="text-[#E05206] text-xs md:text-sm font-semibold tracking-[0.35em] uppercase mb-4">
          Curated Selection
        </h4>
        <h2 
          className="text-6xl md:text-[5.5rem] leading-[0.9] font-black uppercase tracking-tighter"
          style={{ color: "var(--fg)" }}
        >
          Recent<br className="hidden md:block" />Projects
        </h2>
      </div>

      {/* ACCORDION CONTAINER */}
      <div className="relative max-w-[1400px] mx-auto px-10 overflow-hidden">
        <div className="h-[85vh] rounded-2xl overflow-hidden">
          <div className="flex h-full w-full">
            {works.map((work, index) => {
              const isActive = active === index;
              const isExpanded = expanded === index;

              return (
                <motion.div
                  key={index}
                  className={`relative h-full overflow-hidden cursor-pointer ${
                    isExpanded ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                  onMouseEnter={() => expanded === null && setActive(index)}
                  onMouseLeave={() => expanded === null && setActive(null)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCursorY(e.clientY - rect.top);
                  }}
                  onClick={() => {
                    setExpanded((prev) => (prev === index ? null : index));
                    setActive(null);
                  }}
                  animate={{
                    width:
                      expanded !== null
                        ? isExpanded
                          ? "100%"
                          : "0%"
                        : active === null
                        ? "25%"
                        : isActive
                        ? "70%"
                        : "10%",
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.76, 0, 0.24, 1],
                  }}
                >
                  {/* BACKGROUND IMAGE */}
                  <div className="absolute inset-0">
                    <Image
                      src={work.src}
                      alt={work.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>

                  {/* VERTICAL TITLE */}
                  <motion.div
                    className="absolute left-6 bottom-10 origin-left -rotate-90"
                    animate={{ opacity: isExpanded ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ color: "var(--fg)" }}
                  >
                    <h3 className="text-xl tracking-widest uppercase">
                      {work.title}
                    </h3>
                  </motion.div>

                  {/* CURSOR ASTERISK */}
                  {isActive && expanded === null && (
                    <motion.div
                      className="absolute left-4 text-xl pointer-events-none"
                      style={{ color: "var(--fg)" }}
                      animate={{ top: cursorY }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      ✳
                    </motion.div>
                  )}

                  {/* EXPANDED CONTENT */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center px-24"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      >
                        <div
                          className="max-w-3xl text-center"
                          style={{ color: "var(--fg)" }}
                        >
                          <h2 className="text-5xl font-bold mb-6">
                            {work.title}
                          </h2>
                          <p className="text-lg leading-relaxed opacity-70">
                            {work.description}
                          </p>
                          <p className="mt-6 text-sm opacity-40">
                            Click again to return
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}
