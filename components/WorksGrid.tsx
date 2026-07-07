"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface WorkItem {
  id: number;
  title: string;
  image: string;
  width: string;
  height: string;
  top: string;
  left: string;
  zIndex: number;
}

function parseTailwindStyle(cls: string, property: 'width' | 'height' | 'top' | 'left'): string {
  if (!cls) return "";
  const arbitraryMatch = cls.match(/\[([^\]]+)\]/);
  if (arbitraryMatch) {
    return arbitraryMatch[1];
  }
  const standardMatch = cls.match(/^[wh]-(.+)$/);
  if (standardMatch) {
    const val = standardMatch[1];
    if (/^\d+(\.\d+)?$/.test(val)) {
      return `${parseFloat(val) * 0.25}rem`;
    }
  }
  return "";
}

// Ordered sequentially to dictate the exact path of the domino/cascade ripple
const worksData: WorkItem[] = [
  { 
    id: 1, 
    title: "Joker", 
    image: "/joker.jpg", 
    width: "w-36", 
    height: "h-48", 
    top: "top-[40%]", 
    left: "left-[12%]", 
    zIndex: 10 
  },

  { 
    id: 2, 
    title: "Track Number", 
    image: "/track.jpg", 
    width: "w-55", 
    height: "h-70", 
    top: "top-[40%]", 
    left: "left-[20%]", 
    zIndex: 21 
  },

  { 
    id: 3, 
    title: "Trump", 
    image: "/trump.jpg", 
    width: "w-44",
    height: "h-56", 
    top: "top-[20%]", 
    left: "left-[20%]", 
    zIndex: 20 
  },

  { 
    id: 4, 
    title: "Retro Car", 
    image: "/retro.jpg", 
    width: "w-48", 
    height: "h-48", 
    top: "top-[32%]", 
    left: "left-[30%]", 
    zIndex: 42 
  },

  { 
    id: 5, 
    title: "Character Illustration", 
    image: "/character.jpeg", 
    width: "w-48", 
    height: "h-56", 
    top: "top-[58%]", 
    left: "left-[31%]", 
    zIndex: 41
  },
  
  { 
    id: 6, 
    title: "Abstract Art", 
    image: "/abstract.jpg", 
    width: "w-52", 
    height: "h-52", 
    top: "top-[12%]", 
    left: "left-[30%]", 
    zIndex: 21
  },

  { 
    id: 7, 
    title: "Lego Character", 
    image: "/lego.jpg", 
    width: "w-50", 
    height: "h-52", 
    top: "top-[4%]", 
    left: "left-[42%]", 
    zIndex: 20
  },

  { 
    id: 8, 
    title: "Neon Pink", 
    image: "/pink.jpg", 
    width: "w-56", 
    height: "h-64", 
    top: "top-[60%]", 
    left: "left-[42%]", 
    zIndex: 38 
  },

  { 
    id: 9, 
    title: "Michael Jackson", 
    image: "/mj.jpg", 
    width: "w-56",                    // Centerpiece overlap
    height: "h-67", 
    top: "top-[26%]", 
    left: "left-[41%]", 
    zIndex: 50 
  }, 

  { 
    id: 10,
    title: "Ambush Red", 
    image: "/ambush.jpeg", 
    width: "w-52", 
    height: "h-68", 
    top: "top-[46%]", 
    left: "left-[53%]", 
    zIndex: 45 
  },

  { 
    id: 11, 
    title: "West Poster", 
    image: "/west.jpg", 
    width: "w-48", 
    height: "h-60", 
    top: "top-[12%]", 
    left: "left-[52%]", 
    zIndex: 22 
  },

  { 
    id: 12, 
    title: "Yellow Poster", 
    image: "/yellow.jpg", 
    width: "w-48", 
    height: "h-64", 
    top: "top-[42%]", 
    left: "left-[62%]", 
    zIndex: 35 
  },

  { 
    id: 13, 
    title: "Blue Typo", 
    image: "/blue.jpeg", 
    width: "w-44", 
    height: "h-52", 
    top: "top-[20%]", 
    left: "left-[64%]", 
    zIndex: 18 
  },

  { 
    id: 14, 
    title: "Popular Red", 
    image: "/popular.jpg", 
    width: "w-36", 
    height: "h-48", 
    top: "top-[38%]", 
    left: "left-[74%]", 
    zIndex: 12 
  }
];

// Mock descriptions — placeholder copy until real project write-ups are ready.
// Keyed by work id so swapping in real descriptions later is a one-line change per item.
const mockDescriptions: Record<number, string> = {
  1: "A character study exploring contrast and mood through minimal color grading and deliberate framing.",
  2: "Typographic composition built around rhythm and repetition, treating numerals as texture rather than data.",
  3: "Bold portraiture experimenting with high-contrast lighting and graphic negative space.",
  4: "A study in form and nostalgia, rendered with clean geometry and a restrained palette.",
  5: "Character design work focused on silhouette clarity and expressive linework.",
  6: "Abstract composition exploring texture, layering, and controlled chromatic tension.",
  7: "Playful figure study balancing modular geometry with a controlled color story.",
  8: "Vivid color-first piece built to hold attention through saturation and contrast.",
  9: "Iconic portrait treatment reworked with a modern editorial lens and tonal precision.",
  10: "Fashion-forward composition pairing bold red tones with sharp, confident framing.",
  11: "Poster-style layout drawing from vintage western typography and worn textures.",
  12: "High-key composition using yellow as both subject and structural anchor.",
  13: "Typographic exploration in blue, balancing legibility with graphic abstraction.",
  14: "A punchy, high-contrast piece designed to read instantly at a glance.",
};

const ambientGradients: Record<number, string> = {
  1: "from-emerald-950 to-neutral-950",
  2: "from-indigo-950 to-neutral-950",
  3: "from-red-950 to-neutral-950",
  4: "from-orange-950 to-neutral-950",
  5: "from-cyan-950 to-neutral-950",
  6: "from-purple-950 to-neutral-950",
  7: "from-yellow-950 to-neutral-950",
  8: "from-pink-950 to-neutral-950",
  9: "from-zinc-800 to-neutral-950",
  10: "from-rose-950 to-neutral-950",
  11: "from-amber-950 to-neutral-950",
  12: "from-yellow-900 to-neutral-950",
  13: "from-blue-950 to-neutral-950",
  14: "from-red-900 to-neutral-950",
};

const ambientGradientsLight: Record<number, string> = {
  1: "from-emerald-100 via-white to-white",
  2: "from-indigo-100 via-white to-white",
  3: "from-red-100 via-white to-white",
  4: "from-orange-100 via-white to-white",
  5: "from-cyan-100 via-white to-white",
  6: "from-purple-100 via-white to-white",
  7: "from-yellow-100 via-white to-white",
  8: "from-pink-100 via-white to-white",
  9: "from-zinc-200 via-white to-white",
  10: "from-rose-100 via-white to-white",
  11: "from-amber-100 via-white to-white",
  12: "from-yellow-50 via-white to-white",
  13: "from-blue-100 via-white to-white",
  14: "from-red-50 via-white to-white",
};

/**
 * WorksGreeting
 *
 * Exact behavioural clone of components/GreetingAnimation.tsx — same font,
 * size, weight, letter spacing, layout, pulsing dot, easing curve, and SVG
 * curvature/masking mechanics. Just like the Home greeting, this panel is
 * already fully covering the screen the instant it mounts (no slide-in).
 * The only differences are:
 *  - Shows a single static "Works" label instead of cycling through the
 *    greetings array.
 *  - Always plays on every visit to the Works page (no sessionStorage
 *    gating — that logic lives only in GreetingProvider for the Home page).
 *
 * Hold timing: previously matched Home's greeting 1:1 (1940ms — the time
 * Home needs to cycle through 8 rotating words, 180ms each, plus a 500ms
 * pause). That cycling duration never applied here since Works only shows
 * one static label, so the text sat on screen ~1.4s longer than it needed
 * to before lifting. Reduced to a flat 900ms hold — short but still
 * comfortably readable — before the same 800ms exit transition begins.
 */
function WorksGreeting({ onFinish }: { onFinish: () => void }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [exit, setExit] = useState(false);

  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
    const resize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Short hold before the lift begins — long enough to comfortably read
  // the single static "Works" label, without the leftover ~1.4s that
  // Home's version needed purely to cycle through its 8 rotating
  // greetings (a step that doesn't apply here since there's only one
  // static word to show).
  useEffect(() => {
    const timer = setTimeout(() => setExit(true), 900);
    return () => clearTimeout(timer);
  }, []);

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
      {size.width > 0 && (
        <motion.svg
          className="absolute inset-0"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
          initial={{ y: 0 }}
          animate={exit ? { y: "-100%" } : { y: 0 }}
          transition={{ duration: 0.8, ease }}
          onAnimationComplete={() => {
            if (exit) onFinish();
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

      {!exit && (
        <div className="relative z-10 h-full flex items-center justify-center text-white text-4xl md:text-6xl font-medium">
          <span className="mr-4 h-3 w-3 rounded-full bg-white animate-pulse" />
          <span>Works</span>
        </div>
      )}
    </div>
  );
}

function WorksMobileView({
  ready,
  worksList,
  darkGradients,
  lightGradients,
  descriptions,
}: {
  ready: boolean;
  worksList: WorkItem[];
  darkGradients: Record<number, string>;
  lightGradients: Record<number, string>;
  descriptions: Record<number, string>;
}) {
  const { dark } = useTheme();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);

  const activeWork = worksList[currentIdx];
  const activeGradient = activeWork ? (dark
    ? darkGradients[activeWork.id]
    : lightGradients[activeWork.id]) : "";

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % worksList.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + worksList.length) % worksList.length);
  };

  if (!activeWork) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-0 bg-gradient-to-b ${activeGradient} transition-colors duration-700`}
      />

      <div className="relative z-10 w-full h-[80vh] overflow-hidden select-none">
        <AnimatePresence mode="wait">
          {!detailOpen && (
            <motion.div
              key="carousel"
              className="relative w-full h-full flex flex-col justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute inset-x-0 top-6 flex flex-col items-center text-center px-6 z-10">
                <AnimatePresence mode="popLayout">
                  <motion.h2
                    key={activeWork.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`text-2xl font-bold uppercase tracking-tight ${dark ? "text-white" : "text-black"}`}
                  >
                    {activeWork.title}
                  </motion.h2>
                </AnimatePresence>
                <span className={`mt-2 text-[10px] uppercase tracking-[0.3em] ${dark ? "text-white/40" : "text-black/40"}`}>
                  {String(currentIdx + 1).padStart(2, "0")} / {String(worksList.length).padStart(2, "0")}
                </span>
              </div>

              <div className="relative w-full h-80 flex items-center justify-center">
                {worksList.map((work, index) => {
                  let offset = index - currentIdx;
                  if (offset < -1) offset += worksList.length;
                  if (offset > 1) offset -= worksList.length;

                  const isActive = offset === 0;
                  const isRight = offset === 1;
                  const isLeft = offset === -1;

                  if (!isActive && !isRight && !isLeft) return null;

                  return (
                    <motion.div
                      key={work.id}
                      layoutId={`mobile-card-${work.id}`}
                      onClick={() => isActive && setDetailOpen(true)}
                      drag={isActive ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -60) handleNext();
                        if (info.offset.x > 60) handlePrev();
                      }}
                      animate={{
                        x: isActive ? 0 : isRight ? 140 : -140,
                        scale: isActive ? 1 : 0.8,
                        rotateY: isActive ? 0 : isRight ? -25 : 25,
                        opacity: isActive ? 1 : 0.35,
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      className={`absolute w-48 h-64 rounded-2xl shadow-2xl cursor-pointer origin-center overflow-hidden border ${
                        dark ? "bg-neutral-900 border-white/10" : "bg-white border-black/10"
                      }`}
                      style={{ zIndex: isActive ? 30 : 10 }}
                    >
                      <Image
                        src={work.image}
                        alt={work.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        priority={index === 0}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <p className={`text-center text-[10px] uppercase tracking-[0.3em] mt-6 ${dark ? "text-white/30" : "text-black/30"}`}>
                Swipe to browse &middot; Tap to view
              </p>
            </motion.div>
          )}

          {detailOpen && (
            <motion.div
              key="detail"
              className={`fixed inset-0 z-40 bg-gradient-to-b ${activeGradient} flex flex-col justify-end`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className={`absolute top-6 left-6 z-30 backdrop-blur-md p-2.5 rounded-full cursor-pointer ${
                  dark ? "bg-black/40" : "bg-white/60"
                }`}
                onClick={() => setDetailOpen(false)}
              >
                <ChevronLeft className={`w-5 h-5 ${dark ? "text-white" : "text-black"}`} />
              </div>

              <div className="absolute top-0 inset-x-0 h-[45%] overflow-hidden">
                <motion.div layoutId={`mobile-card-${activeWork.id}`} className="relative w-full h-full">
                  <Image
                    src={activeWork.image}
                    alt={activeWork.title}
                    fill
                    className={`object-cover ${dark ? "brightness-[0.65]" : "brightness-100"}`}
                  />
                </motion.div>
                <div
                  className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
                    dark ? "from-neutral-950" : "from-white"
                  }`}
                />
              </div>

              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative bg-white text-black w-full h-[58%] rounded-t-[40px] px-6 pt-8 pb-8 flex flex-col z-20"
              >
                <div className="overflow-y-auto pr-1 space-y-5 scrollbar-none">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold mb-1">
                      {String(currentIdx + 1).padStart(2, "0")} / {String(worksList.length).padStart(2, "0")}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">{activeWork.title}</h1>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-neutral-800 mb-2 uppercase">
                      About this piece
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                      {descriptions[activeWork.id]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailOpen(false)}
                  className="w-full bg-black text-white font-black text-sm uppercase py-4 rounded-2xl tracking-widest mt-6 shadow-xl"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function WorksGrid() {
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [showGreeting, setShowGreeting] = useState(true);
  const [worksList, setWorksList] = useState<WorkItem[]>(worksData);
  const [descriptions, setDescriptions] = useState<Record<number, string>>(mockDescriptions);
  const [darkGradients, setDarkGradients] = useState<Record<number, string>>(ambientGradients);
  const [lightGradients, setLightGradients] = useState<Record<number, string>>(ambientGradientsLight);

  useEffect(() => {
    fetch("/api/content/works-grid")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mappedWorks = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            image: item.image_url,
            width: item.width_class,
            height: item.height_class,
            top: item.top_class,
            left: item.left_class,
            zIndex: item.z_index,
          }));

          const descMap: Record<number, string> = {};
          const darkGradMap: Record<number, string> = {};
          const lightGradMap: Record<number, string> = {};
          data.forEach((item: any) => {
            descMap[item.id] = item.description;
            darkGradMap[item.id] = item.ambient_dark;
            lightGradMap[item.id] = item.ambient_light;
          });

          setWorksList(mappedWorks);
          setDescriptions(descMap);
          setDarkGradients(darkGradMap);
          setLightGradients(lightGradMap);
        }
      })
      .catch(err => console.error("Failed to fetch works grid items", err));
  }, []);

  useEffect(() => {
    if (showGreeting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showGreeting]);

  const easeOutCubic: [number, number, number, number] = [
    0.215,
    0.61,
    0.355,
    1,
  ];

  const dominoVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.85,
      y: 15,
    },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.215, 0.610, 0.355, 1.000],
        delay: index * 0.09,
      },
    }),
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center py-20 select-none" style={{ background: "var(--bg)" }}>

      <div className="relative w-full max-w-[1650px] h-[92vh] translate-x-8 hidden md:block">
        {worksList.map((work, index) => (
          <motion.div
            key={work.id}
            custom={index}
            variants={dominoVariants}
            initial="hidden"
            animate={showGreeting ? "hidden" : "visible"}
            whileHover={{
              scale: 1.05,
              zIndex: 100,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            onClick={() => setSelectedWork(work)}
            className={`absolute ${work.width} ${work.height} ${work.top} ${work.left} cursor-pointer overflow-hidden border border-neutral-900/40 shadow-2xl rounded-sm`}
            style={{
              zIndex: work.zIndex,
              top: parseTailwindStyle(work.top, 'top') || undefined,
              left: parseTailwindStyle(work.left, 'left') || undefined,
              width: parseTailwindStyle(work.width, 'width') || undefined,
              height: parseTailwindStyle(work.height, 'height') || undefined,
            }}
          >
            <div className="relative w-full h-full group bg-neutral-900">
              <Image
                src={work.image}
                alt={work.title}
                fill
                sizes="(max-width: 768px) 150px, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-103"
                priority={index < 4}
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-300" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full md:hidden">
        <WorksMobileView
          ready={!showGreeting}
          worksList={worksList}
          darkGradients={darkGradients}
          lightGradients={lightGradients}
          descriptions={descriptions}
        />
      </div>

      {showGreeting && (
        <WorksGreeting onFinish={() => setShowGreeting(false)} />
      )}

      <AnimatePresence>
        {selectedWork && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWork(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => setSelectedWork(null)}
              className="fixed top-6 right-6 sm:top-8 sm:right-8 z-[1000] p-3 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </motion.button>

            <motion.div
              initial={{ y: "100vh", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100vh", opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 130 }}
              className="relative max-w-4xl w-full bg-[#f4f1eb] p-6 sm:p-8 rounded-none shadow-2xl flex flex-col items-center border border-white/10"
            >
              <div className="relative w-full aspect-[4/3] max-h-[60vh] bg-neutral-200 overflow-hidden border border-neutral-300">
                <Image
                  src={selectedWork.image}
                  alt={selectedWork.title}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                />
              </div>

              <h2 className="mt-6 font-serif text-3xl sm:text-4xl text-neutral-900 tracking-tight">
                {selectedWork.title}
              </h2>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}