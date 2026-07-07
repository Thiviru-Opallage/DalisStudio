"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { sfPro } from "@/lib/fonts";

// Icon primitives (from the original HeroSection ThemeToggle)

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="rgba(255,255,255,0.92)"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.92)"
      strokeWidth="2"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.92)" stroke="none" />
      <line x1="12" y1="2"    x2="12" y2="5"    />
      <line x1="12" y1="19"   x2="12" y2="22"   />
      <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2"    y1="12"   x2="5"    y2="12"   />
      <line x1="19"   y1="12"   x2="22"   y2="12"   />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  );
}

// Original hero-size dimensions, preserved exactly as the default. Callers
// (like the Navbar side menu) can pass smaller sizes without touching the
// hero's own usage, since HeroSection's <ThemeSwitch /> still renders these
// defaults untouched.
const PILL_W = 110;
const PILL_H = 45;
const KNOB_D = 36;

interface SphereToggleProps {
  /** Overall pill width in px. Defaults to the original hero size (110). */
  width?: number;
  /** Overall pill height in px. Defaults to the original hero size (45). */
  height?: number;
  /** Knob diameter in px. Defaults to the original hero size (36). */
  knobSize?: number;
}

// Exported so it can be reused at a smaller size inside the Navbar's side
// menu, in addition to its original full-size usage in the Hero section via
// the default-exported <ThemeSwitch /> below.
export function SphereToggle({
  width = PILL_W,
  height = PILL_H,
  knobSize = KNOB_D,
}: SphereToggleProps) {
  const { dark, toggleTheme } = useTheme();

  const pillW = width;
  const pillH = height;
  const knobD = knobSize;
  // Label font scales down proportionally with the pill so smaller
  // instances (e.g. in the side menu) don't render oversized text.
  const scale = pillH / PILL_H;
  const labelFontSize = 11 * scale;

  // knob rests at x=0 (dark/moon left) or x=pillW-knobD (light/sun right)
  const knobX = dark ? 0 : pillW - knobD;

  return (
    <div
      style={{
        position: "relative",
        width: pillW,
        height: knobD,
        cursor: "pointer",
      }}
      onClick={toggleTheme}
      role="button"
      aria-label="Toggle theme"
    >
      {/* Track (pill background) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: pillH,
          borderRadius: pillH,
          background: "rgba(22, 22, 22, 0.80)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Label (opposite side from knob) */}
        <AnimatePresence mode="wait">
          {dark ? (
            <motion.span
              key="label-light"
              className={sfPro.className}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                position: "absolute",
                right: 0,
                width: pillW - knobD,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.60)",
                fontSize: labelFontSize,
                letterSpacing: "0.04em",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              Light
            </motion.span>
          ) : (
            <motion.span
              key="label-dark"
              className={sfPro.className}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                position: "absolute",
                left: 0,
                width: pillW - knobD,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.60)",
                fontSize: labelFontSize + 2 * scale,
                letterSpacing: "0.04em",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              Dark
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Sphere knob (slides left ↔ right, overflows track) */}
      <motion.div
        animate={{ x: knobX }}
        transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.85 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: knobD,
          height: knobD,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 36% 32%, #3c3c3c, #0f0f0f 68%)",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.80), 0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        {/* Icon inside sphere */}
        <AnimatePresence mode="wait">
          {dark ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -25, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1   }}
              exit={{    opacity: 0, rotate:  25, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex" }}
            >
              <MoonIcon />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate:  25, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1   }}
              exit={{    opacity: 0, rotate: -25, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex" }}
            >
              <SunIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function ThemeSwitch() {
  return (
    <div className="absolute bottom-20 left-[6vw] z-50">
      <SphereToggle />
    </div>
  );
}