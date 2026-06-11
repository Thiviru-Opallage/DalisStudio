"use client";

/**
 * CloudyLogoReveal — Rebuilt
 * ─────────────────────────────────────────────────────────────
 * ANIMATION OVERVIEW (replicates the YouTube Mercedes-style reveal):
 *
 * 1. BLACK VOID — pitch-black scene, particle field in background
 * 2. RIM LIGHT SWEEP — light streaks travel along logo edges (energy build-up)
 * 3. LOGO MATERIALISES — chrome logo rotates in from -180° Y axis, opacity 0→1
 * 4. GLINT BURST — bright white point lights sweep across chrome surface
 * 5. IDLE FLOAT + ROTATION — subtle ambient rotation with Float
 * 6. HOVER — logo tilts toward mouse, bloom intensifies
 *
 * BACKGROUND: Radial lines (like a dark starburst / aura) — not a grid,
 * unique to this section, stays minimal.
 *
 * DEPENDENCIES (add to project):
 *   npm install @react-three/fiber @react-three/drei @react-three/postprocessing
 *   (three, framer-motion already present)
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Suspense,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  PerspectiveCamera,
  Environment,
  useGLTF,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
// import { motion as motion3d } from "framer-motion-3d";
import Image from "next/image";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const SCROLL_DISTANCE = "500vh";
const LOGO_REVEAL_AT = 0.12; // logo starts appearing early
const CONTENT_REVEAL_AT = 0.30;

// ─────────────────────────────────────────────────────────────
//  SCROLL LOCK  (same robust logic as before)
// ─────────────────────────────────────────────────────────────
function useScrollLock(
  outerRef: React.RefObject<HTMLDivElement | null>,
  locked: boolean
) {
  useEffect(() => {
    if (!locked) return;
    const getScrollCap = () => {
      const el = outerRef.current;
      if (!el) return Infinity;
      return el.offsetTop + el.offsetHeight - window.innerHeight - 2;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return;
      const cap = getScrollCap();
      if (window.scrollY >= cap) {
        e.preventDefault();
        if (window.scrollY > cap) window.scrollTo({ top: cap });
      }
    };
    let enforcing = true;
    const enforce = () => {
      if (!enforcing) return;
      const cap = getScrollCap();
      if (window.scrollY > cap) window.scrollTo({ top: cap });
      requestAnimationFrame(enforce);
    };
    requestAnimationFrame(enforce);
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchStartY - e.touches[0].clientY;
      if (dy <= 0) return;
      const cap = getScrollCap();
      if (window.scrollY >= cap) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      enforcing = false;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [outerRef, locked]);
}

// ─────────────────────────────────────────────────────────────
//  FLOATING PARTICLES  (background star field)
// ─────────────────────────────────────────────────────────────
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const count = 1200;

  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 2] = -20 - Math.random() * 60;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────
//  SWEEP LIGHT — a spotlight that orbits the logo pre-reveal
// ─────────────────────────────────────────────────────────────
function SweepLight({ revealed }: { revealed: boolean }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const angle = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    if (!revealed) {
      // orbit in a ring before reveal
      angle.current += delta * 1.4;
      const r = 6;
      lightRef.current.position.set(
        Math.cos(angle.current) * r,
        Math.sin(angle.current * 0.7) * 3,
        4
      );
      lightRef.current.intensity = 2.5;
    } else {
      // settle into top-right studio light
      lightRef.current.position.lerp(
        new THREE.Vector3(6, 8, 6),
        delta * 2
      );
      lightRef.current.intensity = 3.5;
    }
  });

  return (
    <spotLight
      ref={lightRef}
      position={[6, 6, 6]}
      angle={0.18}
      penumbra={0.9}
      intensity={3}
      color="#ffffff"
      castShadow={false}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  GLINT LIGHT — sharp point light for chrome glints
// ─────────────────────────────────────────────────────────────
function GlintLight({ revealed }: { revealed: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current || !revealed) return;
    t.current += delta * 0.6;
    // pulse position for glint sweeps
    lightRef.current.position.set(
      Math.sin(t.current * 1.3) * 3,
      Math.cos(t.current * 0.9) * 2,
      3
    );
    lightRef.current.intensity = 2 + Math.sin(t.current * 2.1) * 1.5;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[3, 2, 3]}
      color="#e8f0ff"
      intensity={revealed ? 3 : 0}
      distance={12}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  LOGO MESH — chrome plane with the transparent logo image
// ─────────────────────────────────────────────────────────────
function LogoMesh({
  revealed,
  hovered,
  mouseX,
  mouseY,
}: {
  revealed: boolean;
  hovered: boolean;
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const revealProgress = useRef(0);

  // Load texture
  const texture = React.useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("/mainLogo-removebg.png");
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;

    // Reveal progress
    if (revealed) {
      revealProgress.current = Math.min(revealProgress.current + delta * 0.8, 1);
    } else {
      revealProgress.current = Math.max(revealProgress.current - delta * 1.2, 0);
    }
    const p = revealProgress.current;
    const eased = 1 - Math.pow(1 - p, 3);

    // Y-rotation reveal (starts from -PI, arrives at 0)
    const targetY = revealed ? 0 : -Math.PI;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY + (hovered ? mouseX.current * 0.18 : 0),
      delta * 3.5
    );

    // X tilt from mouse
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      hovered ? -mouseY.current * 0.12 : 0,
      delta * 4
    );

    // Scale: 0.6 → 1.0
    const scale = 0.6 + eased * 0.4;
    groupRef.current.scale.setScalar(scale);

    // Subtle idle rotation when fully revealed
    if (p > 0.9) {
      groupRef.current.rotation.y +=
        delta * 0.12 * (1 - Math.abs(mouseX.current));
    }

    // Rings pulse
    if (ringRef.current && ring2Ref.current) {
      const ringMat = ringRef.current.material as THREE.MeshStandardMaterial;
      const ring2Mat = ring2Ref.current.material as THREE.MeshStandardMaterial;
      ringMat.opacity = eased * (0.5 + Math.sin(t.current * 1.4) * 0.15);
      ring2Mat.opacity = eased * (0.25 + Math.sin(t.current * 0.9 + 1) * 0.1);
      ringRef.current.rotation.z += delta * 0.15;
      ring2Ref.current.rotation.z -= delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer decorative ring */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[1.72, 0.012, 8, 180]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0}
          metalness={1}
          roughness={0.1}
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Inner ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[2.1, 0.006, 8, 180]} />
        <meshStandardMaterial
          color="#aaaaaa"
          transparent
          opacity={0}
          metalness={1}
          roughness={0.2}
        />
      </mesh>

      {/* Logo plane — chrome-like material */}
      <mesh>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          metalness={0.9}
          roughness={0.08}
          envMapIntensity={1.4}
          color="#ffffff"
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
//  THREE CANVAS SCENE
// ─────────────────────────────────────────────────────────────
function Scene({
  revealed,
  hovered,
  mouseX,
  mouseY,
}: {
  revealed: boolean;
  hovered: boolean;
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={42} />
      <ambientLight intensity={0.08} />

      {/* Rim light — left edge */}
      <pointLight position={[-5, 2, 1]} color="#1a1aff" intensity={1.2} />
      {/* Rim light — right edge */}
      <pointLight position={[5, -1, 1]} color="#ffffff" intensity={0.8} />

      <SweepLight revealed={revealed} />
      <GlintLight revealed={revealed} />

      <ParticleField />

      <Float
        speed={revealed ? 1.4 : 0}
        rotationIntensity={revealed ? 0.08 : 0}
        floatIntensity={revealed ? 0.25 : 0}
      >
        <LogoMesh
          revealed={revealed}
          hovered={hovered}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      </Float>

      <Environment files="/hdr/studio_small_03_1k.hdr" />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.4}
          intensity={revealed ? 0.9 : 0.3}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  RADIAL LINE BACKGROUND  (SVG — unique to this section)
//  Subtle starburst of dark lines emanating from center
// ─────────────────────────────────────────────────────────────
function RadialBackground() {
  const lineCount = 24;
  const cx = 50;
  const cy = 50;
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle = (i / lineCount) * 360;
    const rad = (angle * Math.PI) / 180;
    const x2 = cx + Math.cos(rad) * 80;
    const y2 = cy + Math.sin(rad) * 80;
    return { x1: cx, y1: cy, x2, y2 };
  });

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ opacity: 0.07 }}
      >
        <defs>
          <radialGradient id="lineGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="35%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="lineMask">
            <rect width="100" height="100" fill="url(#lineGrad)" />
          </mask>
        </defs>
        <g mask="url(#lineMask)">
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="white"
              strokeWidth="0.08"
            />
          ))}
        </g>
        {/* Concentric circles */}
        {[10, 22, 36, 52].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="0.06"
            opacity={0.5 - i * 0.1}
          />
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SCROLL HINT
// ─────────────────────────────────────────────────────────────
function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 1.2, delay: 1.2 }}
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          <span
            style={{
              fontSize: "7px",
              letterSpacing: "0.46em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            scroll to reveal
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "1px",
              height: "32px",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
//  CONTENT BELOW LOGO
// ─────────────────────────────────────────────────────────────
function LogoContent({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          style={{
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0",
            zIndex: 20,
            pointerEvents: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, letterSpacing: "0.18em" }}
            animate={{ opacity: 1, letterSpacing: "0.54em" }}
            transition={{ duration: 2.2, delay: 0.6 }}
            style={{
              color: "rgba(255,255,255,0.92)",
              fontSize: "clamp(9px, 0.75vw, 12px)",
              letterSpacing: "0.54em",
              textTransform: "uppercase",
              fontWeight: 300,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            Dalis&nbsp;Studio
          </motion.h2>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "clamp(32px, 4vw, 56px)",
              height: "1px",
              background: "rgba(255,255,255,0.18)",
              transformOrigin: "center",
              margin: "1.4rem 0",
            }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, delay: 1.3 }}
            style={{
              color: "rgba(180,180,180,1)",
              fontSize: "clamp(8px, 0.6vw, 10px)",
              letterSpacing: "0.18em",
              fontWeight: 300,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textAlign: "center",
              maxWidth: "280px",
              lineHeight: 2,
            }}
          >
            A curation of{" "}
            <em
              style={{
                fontStyle: "italic",
                color: "rgba(220,220,220,1)",
                fontFamily: "Georgia, serif",
              }}
            >
              silent authority
            </em>{" "}
            in form and function.
          </motion.p>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.8 }}
            whileHover={{
              scale: 1.05,
              backgroundColor: "white",
              color: "black",
            }}
            style={{
              marginTop: "2.4rem",
              border: "1px solid rgba(255,255,255,0.22)",
              padding: "13px 52px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,1)",
              background: "transparent",
              backdropFilter: "blur(8px)",
              fontSize: "clamp(8px, 0.6vw, 10px)",
              letterSpacing: "0.34em",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              cursor: "pointer",
              transition: "all 500ms",
            }}
          >
            Explore Collection
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────
const CloudyLogoReveal = () => {
  const outerRef = useRef<HTMLDivElement>(null);

  const [revealed, setRevealed] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [hovered, setHovered] = useState(false);

  const mouseX = useRef(0);
  const mouseY = useRef(0);

  // ── Scroll progress ──────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  const smoothed = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.0005,
  });

  useEffect(() => {
    return smoothed.on("change", (v) => {
      setLiveProgress(v);
      setRevealed(v >= LOGO_REVEAL_AT);
      setContentVisible(v >= CONTENT_REVEAL_AT);
    });
  }, [smoothed]);

  // ── Mouse for 3D tilt ────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseX.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY.current = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, []);

  // ── Scroll lock ──────────────────────────────────────────────
  useScrollLock(outerRef, !revealed);

  return (
    <div ref={outerRef} style={{ height: SCROLL_DISTANCE }} className="relative">
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: "#000000" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          mouseX.current = 0;
          mouseY.current = 0;
        }}
      >
        {/* z:0 — Radial line background */}
        <RadialBackground />

        {/* z:1 — Three.js Canvas */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <Canvas
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            dpr={[1, 2]}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <Scene
                revealed={revealed}
                hovered={hovered}
                mouseX={mouseX}
                mouseY={mouseY}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* z:20 — Content below logo */}
        <LogoContent visible={contentVisible} />

        {/* z:25 — Scroll hint */}
        <ScrollHint visible={liveProgress < 0.06} />

        {/* z:20 — Corner label */}
        <div
          className="absolute bottom-8 w-full flex justify-end px-12 pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <span
            style={{
              fontSize: "7px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.10)",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            how the studio works
          </span>
        </div>

        {/* z:30 — Scroll progress bar */}
        {liveProgress < 0.99 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ zIndex: 30, background: "rgba(255,255,255,0.04)" }}
          >
            <div
              style={{
                height: "100%",
                background: "rgba(255,255,255,0.22)",
                width: `${liveProgress * 100}%`,
                transition: "width 0.1s linear",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudyLogoReveal;