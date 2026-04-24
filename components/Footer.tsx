"use client";
import React, { useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Fredoka } from "next/font/google";
import { useEyeStore } from "./stores/useEyeStore";
import { AnimatedEye } from "./AnimatedEye";
import { sfPro } from "@/lib/fonts";


const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

// ─── SVG Social Icons ─────────────────────────────────────────────────────────
const BehanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="15" height="15" aria-hidden="true">
    <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.7zM15.971 13h4.068c-.136-1.889-1.411-2.355-2.009-2.355-.659 0-1.895.402-2.059 2.355zM7.44 10.85c1.081-.336 1.82-.922 1.82-2.17 0-2.137-1.63-3.18-3.903-3.18H0v14h5.568c2.506 0 4.432-1.226 4.432-3.567 0-1.535-.892-2.667-2.56-3.083zm-4.936-3.6h2.584c.828 0 1.458.456 1.458 1.337 0 .876-.63 1.337-1.458 1.337H2.504V7.25zm2.978 8.5H2.504v-3h2.978c1.05 0 1.674.547 1.674 1.5s-.624 1.5-1.674 1.5z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="15" height="15" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="15" height="15" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="15" height="15" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const socialIcons = [
  { name: "Behance",   Icon: BehanceIcon,   color: "#0057ff" },
  { name: "Instagram", Icon: InstagramIcon, color: "#e1306c" },
  { name: "LinkedIn",  Icon: LinkedInIcon,  color: "#0077b5" },
  { name: "Facebook",  Icon: FacebookIcon,  color: "#1877f2" },
];

// ─── "LET'S COLLABORATE" staggered bounce ────────────────────────────────────
const LetsCollaborateText = () => {
  const text = "LET'S COLLABORATE";

  const containerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
  };

  const letterVariants = {
    initial: { opacity: 0, y: -30, scale: 0.7 },
    animate: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring" as const, damping: 14, stiffness: 220 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "50px" }}
      className="flex flex-wrap justify-center mt-2"
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={i}
          variants={letterVariants}
          className={`inline-block text-lg md:text-xl font-bold tracking-widest uppercase text-white ${fredoka.className}`}
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const setMousePosition = useEyeStore((s) => s.setMousePosition);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => setMousePosition(e.clientX, e.clientY),
    [setMousePosition]
  );

  return (
    <footer
      className="w-full bg-black text-white"
      style={{ overflow: "hidden" }}
      onMouseMove={handleMouseMove}
    >
      {/* ── TOP DIVIDER ── */}
      <div className="w-full h-px bg-white/20" />

      {/* ── MAIN BODY ──
          Reference layout:
          [Logo / STUDIO]   [GOAT A PROJECT? / LET'S COLLABORATE / icons]   [GET IN TOUCH]
      ── */}
      <div
        className="w-full px-8 md:px-12 pt-4 pb-5"
        style={{ boxSizing: "border-box" }}
      >
        <div className="flex items-start justify-between gap-6 w-full">

          {/* LEFT — Logo and STUDIO label side-by-side */}
          <div className="flex flex-row items-center shrink-0 pt-1 gap-3" style={{ width: "12%" }}>
            <Image
              src="/logo.JPEG"
              alt="Dalis Studio"
              width={38}
              height={38}
              className="object-contain"
            />
            <span
              className="font-extrabold text-white uppercase ${sfPro.className}"
              style={{ fontSize: "18px", letterSpacing: "0.15em" }}
            >
              STUDIO
            </span>
          </div>

          {/* CENTER — Headline + subtitle + social icons */}
          <div className="flex flex-col items-center mt-10" style={{ flex: 1, minWidth: 0 }}>

            {/* GOAT A PROJECT? */}
            <h2
              className="font-black leading-none tracking-tight uppercase text-white whitespace-nowrap text-center select-none"
              style={{ fontSize: "clamp(1.6rem, 5.8vw, 5rem)" }}
            >
              G<AnimatedEye />AT A PR<AnimatedEye />JECT?
            </h2>

            {/* LET'S COLLABORATE */}
            <LetsCollaborateText />

            {/* Social icons — centered below the text */}
            <div className="flex items-center justify-center gap-3 mt-5">
              {socialIcons.map((s, i) => (
                <motion.div
                  key={s.name}
                  className="rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: s.color,
                    width: "2rem",
                    height: "2rem",
                    flexShrink: 0,
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    delay: i * 0.35,
                    duration: 1.8,
                    repeat: Infinity,
                    repeatDelay: socialIcons.length * 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ scale: 1.18 }}
                  title={s.name}
                >
                  <s.Icon />
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — GET IN TOUCH */}
          <div
            className="shrink-0 self-end pb-0 flex justify-end mb-4"
            style={{ width: "12%", transform: "translate(16px, 18px)" }}
          >
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: "#e8e8e8" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="bg-white text-black rounded-full font-black uppercase whitespace-nowrap ml-auto"
              style={{
                padding: "0.55rem 1.4rem",
                fontSize: "9px",
                letterSpacing: "0.2em",
                border: "1.5px solid white",
              }}
            >
              GET IN TOUCH
            </motion.button>
          </div>

        </div>
      </div>

      {/* ── COPYRIGHT STRIP — ash/light grey matching the reference ── */}
      <div
        className="w-full text-center py-2"
        style={{ backgroundColor: "#b8b8b8" }}
      >
        <span
          className="uppercase text-black/70"
          style={{ fontSize: "8.5px", letterSpacing: "0.2em" }}
        >
          &copy; {new Date().getFullYear()}{" "}
          <strong className="font-bold text-black">DALIS STUDIO</strong>
          . ALL RIGHTS RESERVED.
        </span>
      </div>
    </footer>
  );
};

export default Footer;