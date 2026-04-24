"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <section className="min-h-screen bg-white text-black px-8 py-24">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold mb-8"
      >
        About Dali Studio
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl text-lg text-gray-700 leading-relaxed"
      >
        Dali Studio is a creative design studio focused on storytelling,
        visual identity, and motion-driven experiences. We believe design
        should feel alive, emotional, and intentional.
      </motion.p>
    </section>
  );
}
