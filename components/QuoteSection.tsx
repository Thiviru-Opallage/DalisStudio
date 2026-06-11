"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { sfPro } from "@/lib/fonts";

// ─── Signature SVG paths ───────────────────────────────────────────────────────
const SIGNATURE_PATHS = [
  "M 12,22 C 15,14 22,11 26,10 M 8,12 L 44,12 M 26,12 C 26,20 24,34 23,46 C 22,56 21,64 22,70",
  "M 38,8 C 38,18 37,32 37,48 C 37,60 37,68 38,72 M 38,46 C 42,38 50,35 56,37 C 62,39 64,45 64,52 C 64,60 62,66 62,72",
  "M 72,56 C 70,52 69,47 70,43 C 71,39 75,36 79,36 C 83,36 86,39 86,43 C 86,48 82,55 77,57 C 72,59 68,56 70,52",
  "M 104,38 C 99,30 91,28 87,35 C 83,42 84,58 88,65 C 92,72 101,74 107,68 C 111,64 113,58 111,50",
  "M 116,50 C 116,56 116,64 116,72 M 116,54 C 119,46 125,43 130,43",
  "M 140,56 C 138,52 137,47 138,43 C 139,39 143,36 147,36 C 151,36 154,39 154,43 C 154,48 150,55 145,57 C 140,59 136,56 138,52",
  "M 166,42 C 162,39 158,39 157,43 C 156,47 157,53 160,58 C 163,63 168,65 172,62 C 176,59 178,53 178,47 C 178,41 176,37 174,37 M 172,62 C 172,67 172,71 173,74",
  "M 184,26 C 184,34 183,48 183,60 C 183,66 183,71 184,74 M 178,48 L 190,48",
  "M 202,40 C 198,38 194,39 193,44 C 192,49 193,58 197,62 C 201,66 207,65 209,60 C 211,55 210,46 206,42 C 203,39 199,38 197,41",
  "M 216,50 C 216,56 216,64 216,72 M 216,54 C 219,46 225,43 230,43",
  "M 6,84 C 50,80 100,78 180,80 C 230,81 290,82 380,78",
];

// ─── AnimatedPath ──────────────────────────────────────────────────────────────
function AnimatedPath({
  d,
  delay,
  onComplete,
}: {
  d: string;
  delay: number;
  onComplete?: () => void;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#f0f0f0"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { delay, duration: 0.58, ease: [0.4, 0, 0.2, 1] },
        opacity: { delay, duration: 0.01 },
      }}
      onAnimationComplete={onComplete}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function QuoteSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sigDone, setSigDone] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const sigDelays = SIGNATURE_PATHS.map((_, i) => 0.4 + i * 0.2);
  const textDelay = sigDelays[sigDelays.length - 1] + 0.4;

  const monoStyle: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 400,
  };

  return (
    <section className="relative w-full h-screen bg-[#0d0d0d] overflow-hidden">
      <motion.div
        ref={cardRef}
        className="relative w-full h-full bg-[#111]"
        style={{ cursor: "default", userSelect: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0 }}
      >
        {/* ── Hairline inset border ── */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />

        {/* ── Corner marks — four tiny L-brackets ── */}
        {[
          { top: 14, left: 14 },
          { top: 14, right: 14 },
          { bottom: 14, left: 14 },
          { bottom: 14, right: 14 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute pointer-events-none z-10"
            style={{
              ...pos,
              width: 10,
              height: 10,
              borderTop: i < 2 ? "1px solid rgba(255,255,255,0.45)" : "none",
              borderBottom: i >= 2 ? "1px solid rgba(255,255,255,0.45)" : "none",
              borderLeft: i % 2 === 0 ? "1px solid rgba(255,255,255,0.45)" : "none",
              borderRight: i % 2 === 1 ? "1px solid rgba(255,255,255,0.45)" : "none",
            }}
          />
        ))}

        {/* ─────────────── TOP ROW ─────────────── */}

        {/* Top-left poem */}
        <motion.p
          className="absolute uppercase text-[#c8c8c8] font-medium"
          style={{
            top: "clamp(30px, 5.5vh, 60px)",
            left: "clamp(32px, 4vw, 60px)",
            fontSize: "clamp(10px, 1vw, 12px)",
            letterSpacing: "0.07em",
            lineHeight: 1.95,
            maxWidth: "210px",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          To see beyond the obvious,<br />
          to imagine beyond limits,<br />
          to shape what doesn't<br />
          exist yet —<br />
          that is the first act<br />
          of creation.
        </motion.p>

        {/* Top-right studio name */}
        <motion.span
          className="absolute uppercase text-[#f2f2f2] font-bold"
          style={{
            fontWeight: 700,
            top: "clamp(30px, 5.5vh, 60px)",
            right: "clamp(32px, 4vw, 60px)",
            fontSize: "clamp(15px, 1.7vw, 24px)",
            letterSpacing: "0.22em",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Dalis Studio
        </motion.span>

        {/* ─────────────── MIDDLE: Signature + rules ─────────────── */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "40%",
            left: "clamp(32px, 4vw, 60px)",
            right: "clamp(32px, 4vw, 60px)",
            transform: "translateY(-50%)",
          }}
        >
          {/* Left rule */}
          <div
            style={{
              width: "clamp(28px, 3.5vw, 52px)",
              height: "1px",
              background: "#777",
              flexShrink: 0,
            }}
          />

          {/* Signature */}
          <div className="flex justify-center items-center" style={{ margin: "0 clamp(8px, 1vw, 14px)" }}>
            {inView && (
              <svg
                viewBox="0 0 400 100"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "clamp(180px, 36vw, 460px)", height: "auto", overflow: "visible" }}
              >
                {SIGNATURE_PATHS.map((d, i) => (
                  <AnimatedPath
                    key={i}
                    d={d}
                    delay={sigDelays[i]}
                    onComplete={
                      i === SIGNATURE_PATHS.length - 1
                        ? () => setSigDone(true)
                        : undefined
                    }
                  />
                ))}
              </svg>
            )}
          </div>

          {/* Right rule */}
          <div
            style={{
              width: "clamp(28px, 3.5vw, 52px)",
              height: "1px",
              background: "#777",
              flexShrink: 0,
            }}
          />
        </div>

        {/* ─────────────── MAIN QUOTE (below signature) ─────────────── */}
        <motion.div
          className="absolute text-center"
          style={{
            top: "54%",
            left: "clamp(32px, 4vw, 60px)",
            right: "clamp(32px, 4vw, 60px)",
            margin: "0 auto",
            maxWidth: "680px",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={sigDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ delay: 0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="uppercase text-[#f0f0f0] font-medium"
            style={{
              fontSize: "clamp(10px, 1.3vw, 16px)",
              letterSpacing: "0.13em",
              lineHeight: 2.1,
            }}
          >
            Modesty was never the goal —<br />
            creating work that commands<br />
            attention was.
          </p>
        </motion.div>

        {/* ─────────────── BOTTOM RIGHT sub-text ─────────────── */}
        <motion.p
          className="absolute uppercase text-right mb-4 font-normal"
          style={{
            color: "#5a5a5a",
            bottom: "clamp(52px, 9.5vh, 88px)",
            right: "clamp(32px, 4vw, 60px)",
            fontSize: "clamp(9px, 0.9vw, 12px)",
            letterSpacing: "0.09em",
            lineHeight: 2.2,
            maxWidth: "260px",
            textAlign: "right",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={sigDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Just to create sub-sub everybody sees 'cause the work is 
          commanding 'cause it's bold never modest 'cause it commands
        </motion.p>

        {/* ─────────────── BOTTOM DIVIDER LINE ─────────────── */}
        <div
          className="absolute"
          style={{
            bottom: "clamp(70px, 10vh, 120px)",
            left: "clamp(32px, 4vw, 60px)",
            right: "clamp(32px, 4vw, 60px)",
            height: "1px",
            background: "#ffffff",
          }}
        />

        {/* ─────────────── FOOTER ─────────────── */}
        <motion.div
          className="absolute flex items-center"
          style={{
            bottom: "clamp(40px, 6vh, 80px)",
            left: "clamp(32px, 4vw, 60px)",
            gap: "clamp(10px, 1.4vw, 20px)",
          }}
          initial={{ opacity: 0 }}
          animate={sigDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {["Attention", "Intention", "Creation"].map((word, i) => (
            <div key={word} className="flex items-center" style={{ gap: "clamp(10px, 1.4vw, 20px)" }}>
              <span
                className="uppercase text-bold"
                style={{
                  ...monoStyle,
                  color: "#888",
                  fontSize: "clamp(14px, 1.1vw, 16px)",
                  letterSpacing: "0.22em",
                }}
              >
                {word}
              </span>
              {i < 2 && (
                <span style={{ color: "#444", fontSize: "10px" }}>·</span>
              )}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}