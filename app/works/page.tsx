"use client";

import { motion } from "framer-motion";

const works = Array.from({ length: 6 }, (_, i) => `Project ${i + 1}`);

export default function WorksPage() {
  return (
    <section className="min-h-screen bg-white text-black px-8 py-24">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold mb-12"
      >
        Selected Works
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {works.map((work, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-xl font-semibold"
          >
            {work}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
