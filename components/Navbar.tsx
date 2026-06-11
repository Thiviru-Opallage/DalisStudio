"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { sfPro } from "@/lib/fonts";

const navItems = [
  { num: "01", label: "Home", href: "/", showOnTop: false },
  { num: "02", label: "Works", href: "/works", showOnTop: true },
  { num: "03", label: "About", href: "/about", showOnTop: true },
  { num: "04", label: "Contact", href: "/contact", showOnTop: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    setDimension({ width: window.innerWidth, height: window.innerHeight });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuEase = cubicBezier(0.76, 0, 0.24, 1);

  const initialPath = `M100 0 L100 ${dimension.height} Q-100 ${
    dimension.height / 2
  } 100 0`;

  const targetPath = `M100 0 L100 ${dimension.height} Q100 ${
    dimension.height / 2
  } 100 0`;

  return (
    <>
      {/* TOP DESKTOP NAV */}
      <nav
        className={`fixed top-0 left-0 w-full px-10 py-8 z-40 transition-opacity duration-300 ${
          isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="relative flex items-center justify-between">
          {/* LEFT — LOGO */}
          <Link href="/" className="flex items-center">
            <div
              className="w-11 h-11 flex items-center justify-center rounded-full"
              style={{ background: "var(--fg)" }}
            >
              <Image
                src="/mainLogo2-removebg.PNG"
                alt="Dalis Studio Logo"
                width={50}
                height={50}
                className="object-contain"
              />
            </div>
          </Link>

          {/* CENTER — BRAND */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 text-md tracking-wide ${sfPro.className}`}
            style={{ color: "var(--fg)" }}
          >
            <span className="font-bold">Dalis</span>{" "}
            <span className="font-medium">Studio</span>
          </div>

          {/* RIGHT — NAV LINKS */}
          <div className="flex gap-10 items-center">
            {navItems
              .filter((item) => item.showOnTop)
              .map((item) => (
                <Link
                  key={item.num}
                  href={item.href}
                  className={`${sfPro.className} text-lg font-medium transition-opacity hover:opacity-50`}
                  style={{ color: "var(--fg)" }}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
      </nav>

      {/* FLOATING HAMBURGER */}
      <div className="fixed top-8 right-8 z-70">
        <motion.button
          onClick={() => setOpen(!open)}
          initial={{ scale: 0 }}
          animate={{ scale: isScrolled || open ? 1 : 0 }}
          whileHover={{ scale: 1.1 }}
          className="w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-2xl border border-white/10"
          style={{ background: "var(--fg)" }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0, y: open ? 4 : 0 }}
            className="w-7 h-0.5"
            style={{ background: "var(--bg)" }}
          />
          <motion.div
            animate={{ rotate: open ? -45 : 0, y: open ? -4 : 0 }}
            className="w-7 h-0.5"
            style={{ background: "var(--bg)" }}
          />
        </motion.button>
      </div>

      {/* SIDE MENU */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ x: "calc(100% + 100px)" }}
            animate={{ x: "0%" }}
            exit={{ x: "calc(100% + 100px)" }}
            transition={{ duration: 0.8, ease: menuEase }}
            className="fixed top-0 right-0 h-screen w-full md:w-[600px] z-60 shadow-2xl"
            style={{ background: "var(--bg)", color: "var(--fg)" }}
          >
            <svg className="absolute top-0 -left-[99px] w-[100px] h-full pointer-events-none">
              <motion.path
                fill="var(--bg)"
                initial={{ d: initialPath }}
                animate={{ d: targetPath }}
                exit={{ d: initialPath }}
                transition={{ duration: 0.8, ease: menuEase }}
              />
            </svg>

            <div className="flex flex-col justify-center h-full px-12 md:px-20">
              <p className="text-xs border-b pb-2 uppercase mb-12 tracking-widest opacity-60">
                Navigation
              </p>

              <div className="flex flex-col space-y-6">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.num}
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: 0.1 + i * 0.05,
                      duration: 0.5,
                      ease: menuEase,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-6 group"
                    >
                      <span className="text-2xl md:text-3xl font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                        {item.num}
                      </span>
                      <span className="text-4xl md:text-6xl font-medium hover:opacity-70 transition-opacity">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
