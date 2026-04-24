"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeSwitch() {
  const { dark, toggleTheme } = useTheme();
  const [showNavSwitch, setShowNavSwitch] = useState(false);

  // Scroll logic
  useEffect(() => {
    const onScroll = () => {
      setShowNavSwitch(window.scrollY > window.innerHeight * 0.9);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const Track = ({ small = false }: { small?: boolean }) => {
    const knobX = small ? 26 : 72;

    return (
      <button
        onClick={toggleTheme}
        className={`
          relative flex items-center rounded-full overflow-hidden
          ${small ? "w-14 h-7 px-1" : "w-32 h-12 px-2"}
          cursor-pointer
        `}
        style={{
          background: "var(--fg)",
        }}
      >
        <motion.div
          initial={false}
          animate={{
            x: dark ? knobX : 0,
            y: "-50%",
            scale: dark ? 1.05 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 30,
            mass: 0.8,
          }}
          className={`
            absolute top-1/2
            ${small ? "w-5 h-5" : "w-9 h-9"}
            rounded-full
            flex items-center justify-center
            shadow-md
          `}
          style={{
            background: "var(--bg)",
            color: "var(--fg)",
          }}
        >
          {dark ? (
            <Moon size={small ? 12 : 14} />
          ) : (
            <Sun size={small ? 12 : 14} />
          )}
        </motion.div>
      </button>
    );
  };

  return (
    <>
      {/* HERO SWITCH */}
      {!showNavSwitch && (
        <div className="absolute bottom-20 left-[6vw] z-50">
          <Track />
        </div>
      )}

      {/* NAV SWITCH */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: showNavSwitch ? 1 : 0 }}
        transition={{
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="fixed top-8 left-8 z-50"
      >
        <Track small />
      </motion.div>
    </>
  );
}
