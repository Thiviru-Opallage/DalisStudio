"use client";
import React, { useRef, useEffect } from "react";
import { motion, useSpring } from "framer-motion";
import { useEyeStore } from "./stores/useEyeStore";

export const AnimatedEye = () => {
  const eyeRef = useRef<HTMLDivElement>(null);
  const mouseX = useEyeStore((state) => state.mouseX);
  const mouseY = useEyeStore((state) => state.mouseY);

  // Tighter spring = snappier, more reactive feel
  const pupilX = useSpring(0, { stiffness: 300, damping: 20 });
  const pupilY = useSpring(0, { stiffness: 300, damping: 20 });

  useEffect(() => {
    if (!eyeRef.current) return;

    const rect = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);

    // Increased maxDist from width/3.5 → width/2.5 for more visible travel
    const maxDist = rect.width / 2.5;

    pupilX.set(Math.cos(angle) * maxDist);
    pupilY.set(Math.sin(angle) * maxDist);
  }, [mouseX, mouseY, pupilX, pupilY]);

  return (
    <span
      ref={eyeRef as React.RefObject<HTMLSpanElement>}
      className="inline-flex items-center justify-center bg-white rounded-full w-[0.75em] h-[0.75em] align-middle mx-[0.05em] shadow-inner overflow-hidden"
      style={{ verticalAlign: "middle" }}
    >
      <motion.span
        style={{ x: pupilX, y: pupilY }}
        className="bg-black rounded-full w-[55%] h-[55%] block shrink-0"
      />
    </span>
  );
};