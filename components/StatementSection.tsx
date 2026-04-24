"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ReactiveQuote from "@/components/CloudyLogoReveal";

export default function StatementSection() {
  return (
    <section className="w-full pt-16 mb-14 pb-16 overflow-hidden" style={{backgroundColor: "var(--background)",}}>
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="flex items-start justify-center gap-6 flex-wrap md:flex-nowrap">

          {/* QUOTE */}
          <div className="max-w-[640px] w-full md:w-auto mt-14">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <ReactiveQuote />
            </motion.div>

            <p className="mt-6 italic opacity-60">— Dalis Studio</p>
          </div>

          {/* CIRCLE + STAR */}
          <div className="relative w-[260px] h-80 shrink-0 mt-16 md:mt-6">

            {/* ROTATING TEXT */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className="absolute inset-0"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <path
                    id="circlePath"
                    d="
                      M 100, 100
                      m -92, 0
                      a 92,92 0 1,1 184,0
                      a 92,92 0 1,1 -184,0
                    "
                  />
                </defs>
                <text
                  fill="currentColor"
                  fontSize="11"
                  letterSpacing="5"
                  className="uppercase opacity-70"
                >
                  <textPath href="#circlePath">
                    WE ARE THE DIFFERENCE • WE DON’T MAKE A DIFFERENCE •
                  </textPath>
                </text>
              </svg>
            </motion.div>

            {/* STAR */}
            <Link href="/about">
              <motion.div
                whileHover={{ scale: 1.12 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="absolute inset-0 flex items-center justify-center cursor-pointer group z-10"
              >
                {/* Glow */}
                <div className="absolute w-44 h-44 rounded-full bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* STAR */}
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 200 200"
                  className="transition-colors duration-300"
                >
                  <path
                    d="
                      M100 0
                      C115 75 135 90 200 100
                      C135 110 115 125 100 200
                      C85 125 65 110 0 100
                      C65 90 85 75 100 0
                      Z
                    "
                    fill="currentColor"
                    className="group-hover:fill-blue-600 transition-colors"
                  />

                  <text
                    x="100"
                    y="102"
                    textAnchor="middle"
                    fill="var(--background)"
                    fontSize="11"
                    letterSpacing="6"
                    className="uppercase select-none pointer-events-none"
                  >
                    ABOUT ME
                  </text>
                </svg>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="max-w-[1075px] mx-auto px-10 mt-20">
        <div className="flex items-center">
          <div className="flex-1 h-px opacity-30 bg-current" />
          <div className="w-3 h-3 rounded-full bg-current" />
        </div>
      </div>
    </section>
  );
}
