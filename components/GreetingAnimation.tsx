"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

const greetings = [
  { text: "Hello" },
  { text: "ආයුබෝවන්" },
  { text: "வணக்கம்" }, //Tamil
  { text: "مرحبًا" }, //Arabic
  { text: "你好"  }, //Chinese
  { text: "こんにちは"  }, //Japanese
  { text: "สวัสดี"  }, //Thai
  { text: "Bonjour" } //French

];

type GreetingAnimationProps = {
  onFinish?: () => void;
};

export default function GreetingAnimation({ onFinish }: GreetingAnimationProps) {
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [exit, setExit] = useState(false);

  // Track window size
  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
    const resize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Animate greetings
  useEffect(() => {
    const interval = setInterval(() => {
      if (index < greetings.length - 1) {
        setIndex((i) => i + 1);
      } else {
        clearInterval(interval);
        setTimeout(() => setExit(true), 500);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [index]);

  const ease = cubicBezier(0.76, 0, 0.24, 1);
  const curveHeight = 120;

  const rectPath = `
    M0 0
    L${size.width} 0
    L${size.width} ${size.height}
    L0 ${size.height}
    Z
  `;

  const curvedPath = `
    M0 0
    L${size.width} 0
    L${size.width} ${size.height - curveHeight}
    Q${size.width / 2} ${size.height + curveHeight} 0 ${size.height - curveHeight}
    Z
  `;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Animated SVG with Rounded Bottom */}
      {size.width > 0 && (
        <motion.svg
          className="absolute inset-0"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
          initial={{ y: 0 }}
          animate={exit ? { y: "-100%" } : { y: 0 }}
          transition={{ duration: 0.8, ease }}
          onAnimationComplete={() => {
            if (exit && onFinish) onFinish();
          }}
          style={{ willChange: "transform" }}
        >
          <motion.path
            d={exit ? curvedPath : rectPath}
            fill="#141516"
            transition={{ duration: 0.8, ease }}
          />
        </motion.svg>
      )}

      {/* Greeting Text */}
      {!exit && (
        <div className="relative z-10 h-full flex items-center justify-center text-white text-4xl md:text-6xl font-medium">
          <span className="mr-4 h-3 w-3 rounded-full bg-white animate-pulse" />
          <AnimatePresence mode="wait">
            <motion.p
              key={greetings[index].text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {greetings[index].text}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
