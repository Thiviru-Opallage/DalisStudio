"use client";

import React, { useRef, useEffect, useState, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import LiveClock from './LiveClock';
import Image from 'next/image';

// ── Noise overlay ─────────────────────────────────────────────────────────────

function Noise({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-100 transition-opacity duration-300"
      style={{
        opacity: isHovered ? 0.06 : 0.02,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ── Letter flip ───────────────────────────────────────────────────────────────

interface FlipLetterProps {
  char: string;
  fontSize: string;
  color?: string;
  flipColor?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  letterSpacing?: string;
  lineHeight?: number | string;
  opacity?: number;
}

function FlipLetter({
  char,
  fontSize,
  color = 'var(--fg)',
  flipColor = '#e8c840',
  fontFamily = '"Arial Black","Helvetica Neue",sans-serif',
  fontWeight = 900,
  letterSpacing = '-0.03em',
  lineHeight = 0.88,
  opacity = 1,
}: FlipLetterProps) {
  const [flipped, setFlipped] = useState(false);

  const isSpace = char === ' ' || char === '\u00A0';

  // For space characters just render a non-breaking space without interaction
  if (isSpace) {
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize,
          fontFamily,
          fontWeight,
          letterSpacing,
          lineHeight,
          opacity,
          color,
          userSelect: 'none',
        }}
      >
        &nbsp;
      </span>
    );
  }

  const innerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.52s cubic-bezier(0.23, 1, 0.32, 1)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight,
  };

  const faceBase: CSSProperties = {
    display: 'block',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    userSelect: 'none',
  };

  const backStyle: CSSProperties = {
    ...faceBase,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'rotateY(180deg)',
    color: flipColor,
  };

  return (
    <span
      style={{ display: 'inline-block', perspective: '500px', cursor: 'default' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <span style={innerStyle}>
        <span style={{ ...faceBase, color, opacity }}>{char}</span>
        <span style={backStyle}>{char}</span>
      </span>
    </span>
  );
}

// ── Flip word (big display text) ──────────────────────────────────────────────

interface FlipWordProps {
  word: string;
  fontSize: string;
  suffix?: React.ReactNode;
}

function FlipWord({ word, fontSize, suffix }: FlipWordProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {[...word].map((char, i) => (
        <FlipLetter
          key={i}
          char={char}
          fontSize={fontSize}
          color="var(--fg)"
          flipColor="#e8c840"
          fontFamily='"Arial Black","Helvetica Neue",sans-serif'
          fontWeight={900}
          letterSpacing="-0.03em"
          lineHeight={0.88}
        />
      ))}
      {suffix && (
        <span
          style={{
            fontSize: '1em',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: 0,
            marginLeft: '0.04em',
            alignSelf: 'flex-start',
            marginTop: '0.5em',
            color: 'var(--fg)',
            fontFamily: '"Arial Black","Helvetica Neue",sans-serif',
            userSelect: 'none',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

// ── Flip subtitle (spaced small caps) ────────────────────────────────────────

function FlipSubtitle({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {[...text].map((char, i) => (
        <FlipLetter
          key={i}
          char={char}
          fontSize="clamp(7.5px, 0.65vw, 11px)"
          color="var(--fg)"
          flipColor="#e8c840"
          fontFamily='"Helvetica Neue",Arial,sans-serif'
          fontWeight={300}
          letterSpacing="0em"
          lineHeight={1}
          opacity={0.45}
        />
      ))}
    </div>
  );
}

// ── Main Hero ─────────────────────────────────────────────────────────────────

const Hero = () => {
  const imgRef  = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rafRef  = useRef<number>(0);
  const mouse   = useRef({ x: 0, y: 0 });
  const curr    = useRef({ x: 0, y: 0 });
  const isHov   = useRef(false);
  const [blockHover, setBlockHover] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const img  = imgRef.current;
    if (!hero || !img) return;

    const onEnter = () => { isHov.current = true; };
    const onLeave = () => { isHov.current = false; };
    const onMove  = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      mouse.current.x = (e.clientX - r.left) / r.width  - 0.5;
      mouse.current.y = (e.clientY - r.top)  / r.height - 0.5;
    };

    hero.addEventListener('mouseenter', onEnter);
    hero.addEventListener('mouseleave', onLeave);
    hero.addEventListener('mousemove',  onMove);

    const tick = () => {
      const ease = isHov.current ? 0.06 : 0.04;
      curr.current.x += (mouse.current.x - curr.current.x) * ease;
      curr.current.y += (mouse.current.y - curr.current.y) * ease;
      if (!isHov.current) {
        mouse.current.x *= 0.92;
        mouse.current.y *= 0.92;
      }
      const { x, y } = curr.current;
      img.style.transform = `translate(${x * 22}px,${y * 11}px) skew(${y * 5}deg,${x * 2.5}deg) scale(${1 + (Math.abs(x) + Math.abs(y)) * 0.02})`;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      hero.removeEventListener('mouseenter', onEnter);
      hero.removeEventListener('mouseleave', onLeave);
      hero.removeEventListener('mousemove',  onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /*
   * FONT SIZE MATH (unchanged from original)
   * DALIS  = 5 chars  →  5 × 0.97 = 4.85 em  at fontSize_D
   * STUDIO = 6 chars  →  6 × 0.97 = 5.82 em  at fontSize_S
   * fontSize_S = fontSize_D × (4.85 / 5.82) ≈ fontSize_D × 0.8333
   */
  const fzDalis  = 'clamp(78px, 11vw, 176px)';
  const fzStudio = 'clamp(65px, 9.17vw, 147px)';

  const subtitleVariant = {
    hidden:  { y: '105%', opacity: 0 },
    visible: {
      y: '0%', opacity: 1,
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as [number,number,number,number], delay: 0.72 },
    },
  };

  return (
    <section
      ref={heroRef}
      className="grid-background relative h-screen w-full overflow-hidden flex items-center"
      style={{ color: 'var(--fg)' }}
    >
      <Noise isHovered={blockHover} />

      {/* ── Right: hero image ───────────────────────────────────── */}
      <div
        className="absolute right-0 bottom-0 pointer-events-none"
        style={{ width: '52vw', top: '8%' }}
      >
        <div
          ref={imgRef}
          className="relative w-full h-full will-change-transform"
          style={{ transformOrigin: 'center center' }}
        >
          <Image
            src="/me.PNG"
            alt="Dalis Studio"
            fill
            className="object-contain object-bottom-right"
            style={{ filter: 'grayscale(100%) contrast(1.05)' }}
            priority
          />
        </div>

        <div
          className="absolute bottom-8 z-20 pointer-events-auto -translate-x-1/2"
          style={{ left: '72%' }}
        >
          <LiveClock />
        </div>
      </div>

      {/* ── Centre: vertical rule + meta label ──────────────────── */}
      <div
        className="absolute top-0 bottom-0 z-10 flex flex-col items-center pointer-events-none"
        style={{ left: '47vw' }}
      >
        <div style={{ flex: 1, width: '1px', background: 'var(--grid-line)' }} />
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '9px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: '"Helvetica Neue",Arial,sans-serif',
            fontWeight: 300,
            opacity: 0.28,
            color: 'var(--fg)',
            padding: '1.2rem 0',
            userSelect: 'none',
          }}
        >
          Portfolio&nbsp;·&nbsp;2026
        </div>
        <div style={{ flex: 1, width: '1px', background: 'var(--grid-line)' }} />
      </div>

      {/* ── Left: text block ────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-start justify-center select-none"
        style={{ paddingLeft: '4vw', width: '46vw' }}
        onMouseEnter={() => setBlockHover(true)}
        onMouseLeave={() => setBlockHover(false)}
      >
        {/* Row 1: DALIS */}
        <div className="overflow-hidden" style={{ lineHeight: 0.88 }}>
          <motion.div
            initial={{ y: '105%', opacity: 0, skewY: 4 }}
            animate={{ y: '0%',   opacity: 1, skewY: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <FlipWord word="DALIS" fontSize={fzDalis} />
          </motion.div>
        </div>

        {/* Row 2: STUDIO® */}
        <div className="overflow-hidden mt-[0.04em]" style={{ lineHeight: 0.88 }}>
          <motion.div
            initial={{ y: '105%', opacity: 0, skewY: 4 }}
            animate={{ y: '0%',   opacity: 1, skewY: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          >
            <FlipWord word="STUDIO" fontSize={fzStudio} suffix="®" />
          </motion.div>
        </div>

        {/* Row 3: subtitle — space-between to fill the same width */}
        <div className="overflow-hidden" style={{ marginTop: 'clamp(10px, 1.1vw, 18px)', width: 'calc(100% - 4vw)' }}>
          <motion.p
            variants={subtitleVariant}
            initial="hidden"
            animate="visible"
            style={{
              fontSize: 'clamp(7.5px, 0.65vw, 11px)',
              textTransform: 'uppercase',
              fontWeight: 300,
              opacity: 0.45,
              fontFamily: '"Helvetica Neue",Arial,sans-serif',
              color: 'var(--fg)',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {'Archetype: Creative Designer & Artist'.split('').map((ch, i) => (
              <span key={i} style={{ display: 'inline-block' }}>
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default Hero;