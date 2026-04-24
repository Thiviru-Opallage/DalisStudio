"use client";

/**
 * CloudyLogoReveal
 * ─────────────────────────────────────────────────────────────
 * KEY BEHAVIOURS
 *
 * SCROLL LOCK
 *   The outer div is 600vh. Framer's scrollYProgress (0→1) drives
 *   the animation. BUT we inject a virtual "progress ceiling" —
 *   while the logo hasn't appeared yet we cap the scroll position
 *   so the browser cannot advance past the end of the sticky
 *   section. Concretely: we listen for wheel/touch events and if
 *   the user is at the bottom of the outer div and the logo isn't
 *   revealed, we prevent default and hold position.
 *
 * SCROLL-SCRUBBED 3D
 *   Scroll forward → animation advances frame by frame.
 *   Scroll back    → animation rewinds.
 *   No autoplay timers.
 *
 * PERFORMANCE
 *   • Three.js RAF only runs when section is intersecting viewport
 *   • Particle count tuned: high-end gets 3750 total, low-end 1500
 *   • Textures created once, reused
 *   • A lightweight CSS spinner shows while WebGL initialises
 *
 * MOUSE REACTIVITY
 *   Cloud layers travel ±60/90/130 px — clearly visible at normal
 *   desk mouse movement. Lerp factor 0.06 = snappy but not jumpy.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  motion,
  useScroll,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const SCROLL_DISTANCE = "600vh";
const CAMERA_START_Z  = 34;
const CAMERA_END_Z    = 7;
const IMPLODE_AT      = 0.85;
const LOGO_AT         = 0.95;
const PARTICLES_GONE  = 0.99;

// Detect rough device capability for particle budget
const getParticleBudget = () => {
  if (typeof window === "undefined") return "mid";
  const gl = document.createElement("canvas").getContext("webgl");
  if (!gl) return "low";
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = dbg
    ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string
    : "";
  if (/intel|mali|adreno 3|adreno 4/i.test(renderer)) return "low";
  return "high";
};

// ─────────────────────────────────────────────────────────────
//  SCROLL LOCK
//  Holds the user inside the pinned section until revealed.
//  Uses wheel + touchmove prevention — the "continuous scroll"
//  feel is preserved because we only block at the very bottom
//  of the outer container while unlocked === false.
// ─────────────────────────────────────────────────────────────
function useScrollLock(
  outerRef: React.RefObject<HTMLDivElement | null>,
  locked: boolean,
) {
  useEffect(() => {
    if (!locked) return;

    // The maximum scroll position the user is allowed to reach.
    // We cap it at (sectionTop + sectionHeight - windowHeight - 2),
    // which is exactly the last pixel before the viewport would
    // exit the sticky section. Computed fresh on every event so it
    // stays correct after any layout shift.
    const getScrollCap = () => {
      const el = outerRef.current;
      if (!el) return Infinity;
      return el.offsetTop + el.offsetHeight - window.innerHeight - 2;
    };

    // Wheel: prevent default AND snap back if somehow past cap
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return; // allow scroll-up freely
      const cap = getScrollCap();
      if (window.scrollY >= cap) {
        e.preventDefault();
        // Hard-clamp position in case momentum carried past
        if (window.scrollY > cap) window.scrollTo({ top: cap });
      }
    };

    // rAF-based position enforcer — catches momentum/trackpad glide
    // that slips past the wheel event
    let enforcing = true;
    const enforce = () => {
      if (!enforcing) return;
      const cap = getScrollCap();
      if (window.scrollY > cap) {
        window.scrollTo({ top: cap });
      }
      requestAnimationFrame(enforce);
    };
    requestAnimationFrame(enforce);

    // Touch
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      const dy = touchStartY - e.touches[0].clientY; // positive = scroll down
      if (dy <= 0) return;
      const cap = getScrollCap();
      if (window.scrollY >= cap) e.preventDefault();
    };

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });

    return () => {
      enforcing = false;
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
    };
  }, [outerRef, locked]);
}

// ─────────────────────────────────────────────────────────────
//  THREE.JS SCENE
// ─────────────────────────────────────────────────────────────
interface ThreeSceneHandle {
  setProgress: (p: number) => void;
  pause: ()  => void;
  resume: () => void;
}
interface ThreeSceneProps {
  onProgressChange: (p: number) => void;
  sceneRef: React.RefObject<ThreeSceneHandle | null>;
}

function ThreeScene({ onProgressChange, sceneRef }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // ── STATE ────────────────────────────────────────────────
    const state = {
      progress:  0,
      paused:    false,
      ticks:     0,
      mouse:     { x: 0, y: 0, tx: 0, ty: 0 },
    };

    // ── EXPOSE HANDLE ────────────────────────────────────────
    (sceneRef as React.MutableRefObject<ThreeSceneHandle>).current = {
      setProgress: (p) => { state.progress = p; onProgressChange(p); },
      pause:       ()  => { state.paused = true;  },
      resume:      ()  => { state.paused = false; },
    };

    // ── RENDERER ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020202, 1);
    Object.assign(renderer.domElement.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
    });
    el.appendChild(renderer.domElement);

    // ── SCENE / CAMERA / FOG ─────────────────────────────────
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000000, 0.012);
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 300);
    camera.position.set(0, 0, CAMERA_START_Z);

    // ── MOUSE ────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      state.mouse.tx =  ((e.clientX - r.left) / W - 0.5) * 2;
      state.mouse.ty = -(((e.clientY - r.top)  / H - 0.5)) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── STARS ────────────────────────────────────────────────
    const budget = getParticleBudget();
    const starCount = budget === "high" ? 1800 : 900;
    const sArr = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      sArr[i*3]   = (Math.random()-0.5)*450;
      sArr[i*3+1] = (Math.random()-0.5)*450;
      sArr[i*3+2] = -65 - Math.random()*130;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sArr, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff, transparent: true, opacity: 0.48, sizeAttenuation: true });
    const starPts = new THREE.Points(sGeo, starMat);
    scene.add(starPts);

    // ── SMOKE TEXTURE ────────────────────────────────────────
    const sCanvas = document.createElement("canvas");
    sCanvas.width = sCanvas.height = 256;
    const sc = sCanvas.getContext("2d")!;
    const sg = sc.createRadialGradient(128,128,0, 128,128,128);
    sg.addColorStop(0,   "rgba(255,255,255,0.32)");
    sg.addColorStop(0.4, "rgba(255,255,255,0.13)");
    sg.addColorStop(0.8, "rgba(255,255,255,0.03)");
    sg.addColorStop(1,   "rgba(255,255,255,0)");
    sc.fillStyle = sg; sc.fillRect(0,0,256,256);
    const smokeTex = new THREE.CanvasTexture(sCanvas);

    // ── SMOKE PLANES ─────────────────────────────────────────
    const planeCount = budget === "high" ? 22 : 12;
    const smokeMats: THREE.MeshBasicMaterial[] = [];
    const smokePlanes: Array<THREE.Mesh & { userData: Record<string, number> }> = [];
    for (let i = 0; i < planeCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: smokeTex, transparent: true,
        opacity: 0.04 + Math.random()*0.10,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      smokeMats.push(mat);
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(18+Math.random()*22, 18+Math.random()*22), mat
      ) as THREE.Mesh & { userData: Record<string, number> };
      m.position.set((Math.random()-0.5)*46, (Math.random()-0.5)*28, (Math.random()-0.5)*30);
      m.rotation.z = Math.random()*Math.PI*2;
      m.userData.baseOp   = mat.opacity;
      m.userData.rotSpd   = (Math.random()-0.5)*0.0007;
      m.userData.floatAmp = 0.6 + Math.random()*2.2;
      m.userData.floatSpd = 0.00020 + Math.random()*0.0003;
      m.userData.phase    = Math.random()*Math.PI*2;
      scene.add(m);
      smokePlanes.push(m);
    }

    // ── PARTICLES ────────────────────────────────────────────
    interface PG { pts: THREE.Points; pos: Float32Array; vel: Float32Array; phase: Float32Array; mat: THREE.PointsMaterial; baseOp: number; }
    const makeP = (n: number, r: number, spd: number, sz: number, op: number): PG => {
      const pos = new Float32Array(n*3), vel = new Float32Array(n*3), phase = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const th = Math.random()*Math.PI*2, ph2 = Math.acos(2*Math.random()-1);
        const ri = r*(0.2+Math.random()*0.8);
        pos[i*3]   = ri*Math.sin(ph2)*Math.cos(th);
        pos[i*3+1] = ri*Math.sin(ph2)*Math.sin(th);
        pos[i*3+2] = ri*Math.cos(ph2)*(0.2+Math.random()*0.5);
        vel[i*3]   = (Math.random()-0.5)*spd;
        vel[i*3+1] = (Math.random()-0.5)*spd*0.5;
        vel[i*3+2] = (Math.random()-0.5)*spd*0.22;
        phase[i]   = Math.random()*Math.PI*2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ size: sz, color: 0xffffff, transparent: true, opacity: op, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { pts, pos, vel, phase, mat, baseOp: op };
    };

    const m = budget === "high" ? 1 : 0.55;
    const pGroups: PG[] = [
      makeP(Math.floor(2400*m), 28, 0.007, 0.17, 0.46),
      makeP(Math.floor(1200*m), 16, 0.005, 0.28, 0.66),
      makeP(Math.floor(500*m),   5, 0.002, 0.46, 0.88),
    ];

    // ── RINGS ────────────────────────────────────────────────
    const rMats = Array.from({length:3}, () =>
      new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, blending:THREE.AdditiveBlending })
    );
    const rings = [
      new THREE.Mesh(new THREE.TorusGeometry(1.6,0.013,8,160), rMats[0]),
      new THREE.Mesh(new THREE.TorusGeometry(2.9,0.008,8,160), rMats[1]),
      new THREE.Mesh(new THREE.TorusGeometry(4.4,0.005,8,160), rMats[2]),
    ];
    rings.forEach(r => { r.rotation.x = Math.PI*0.5; scene.add(r); });

    // ── RENDER LOOP ──────────────────────────────────────────
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (state.paused) return;

      state.ticks += 0.01;
      const { ticks, mouse, progress } = state;

      // Smooth mouse
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Camera dolly
      const camT  = Math.min(progress / IMPLODE_AT, 1);
      const targZ = CAMERA_START_Z - (CAMERA_START_Z - CAMERA_END_Z) * camT;
      camera.position.z += (targZ - camera.position.z) * 0.06;
      camera.position.x += (mouse.x * 2.4 - camera.position.x) * 0.022;
      camera.position.y += (mouse.y * 1.5 - camera.position.y) * 0.022;
      camera.lookAt(0, 0, 0);

      // Implosion
      const iRaw  = (progress - IMPLODE_AT) / (1 - IMPLODE_AT);
      const iT    = Math.max(0, Math.min(iRaw, 1));
      const iEase = 1 - Math.pow(1-iT, 4);

      pGroups[0].pts.scale.setScalar(1 - iEase*0.60);
      pGroups[1].pts.scale.setScalar(1 - iEase*0.74);
      pGroups[2].pts.scale.setScalar(1 - iEase*0.88);

      // Fade out particles after PARTICLES_GONE
      const fadeOut = progress >= PARTICLES_GONE
        ? Math.max(0, 1 - (progress - PARTICLES_GONE) / (1 - PARTICLES_GONE))
        : 1;
      pGroups.forEach(g  => { g.mat.opacity = g.baseOp * fadeOut; });
      smokeMats.forEach((mat,i) => { mat.opacity = smokePlanes[i].userData.baseOp * fadeOut; });
      starMat.opacity = 0.48 * fadeOut;

      // Rings
      rMats[0].opacity = iEase*0.92*fadeOut;
      rMats[1].opacity = iEase*0.56*fadeOut;
      rMats[2].opacity = iEase*0.30*fadeOut;
      rings[0].scale.setScalar(0.3 + iEase*2.1);
      rings[1].scale.setScalar(0.3 + iEase*2.9);
      rings[2].scale.setScalar(0.3 + iEase*3.8);

      if (progress >= LOGO_AT && fadeOut > 0) {
        rings[0].rotation.y += 0.007;
        rings[1].rotation.y -= 0.005;
        rings[2].rotation.z += 0.003;
      }

      // Particle drift
      pGroups.forEach(({ pts, pos, vel, phase }) => {
        const attr = pts.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          const ph = phase[i];
          pos[i*3]   += vel[i*3]   + Math.sin(ticks*0.5  + ph)*0.0013;
          pos[i*3+1] += vel[i*3+1] + Math.cos(ticks*0.37 + ph)*0.0011;
          pos[i*3+2] += vel[i*3+2];
          const B = 42;
          if (Math.abs(pos[i*3])   > B)  vel[i*3]   *= -1;
          if (Math.abs(pos[i*3+1]) > B)  vel[i*3+1] *= -1;
          if (Math.abs(pos[i*3+2]) > 32) vel[i*3+2] *= -1;
          attr.array[i*3]   = pos[i*3];
          attr.array[i*3+1] = pos[i*3+1];
          attr.array[i*3+2] = pos[i*3+2];
        }
        attr.needsUpdate = true;
        pts.rotation.y += 0.00042;
      });

      smokePlanes.forEach(m => {
        m.rotation.z += m.userData.rotSpd;
        m.position.y += Math.sin(ticks*m.userData.floatSpd*100+m.userData.phase)*m.userData.floatAmp*0.001;
      });

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    // ── PAUSE WHEN OFF-SCREEN (saves GPU) ────────────────────
    const obs = new IntersectionObserver(
      ([entry]) => {
        state.paused = !entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    obs.observe(el);

    // ── RESIZE ───────────────────────────────────────────────
    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      renderer.setSize(W2, H2);
      camera.aspect = W2/H2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize",    onResize);
      renderer.dispose();
      smokeTex.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onProgressChange, sceneRef]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

// ─────────────────────────────────────────────────────────────
//  CLOUD LAYER  — strong mouse parallax, 3-depth interactive
// ─────────────────────────────────────────────────────────────
function CloudLayer({ opacity }: { opacity: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse  = useRef({ x: 0, y: 0 });
  const curr   = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Normalise to -1 … +1
      mouse.current.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      // Fast lerp = snappy & clearly visible reactivity
      curr.current.x += (mouse.current.x - curr.current.x) * 0.06;
      curr.current.y += (mouse.current.y - curr.current.y) * 0.06;

      const el = containerRef.current;
      if (el) {
        const far  = el.querySelector<HTMLElement>("[data-layer='far']");
        const mid  = el.querySelector<HTMLElement>("[data-layer='mid']");
        const near = el.querySelector<HTMLElement>("[data-layer='near']");

        // Travel distances are generous so movement is obviously visible
        if (far)  far.style.transform  = `translate(${curr.current.x * -40}px, ${curr.current.y * -20}px) scale(1.12)`;
        if (mid)  mid.style.transform  = `translate(${curr.current.x * -70}px, ${curr.current.y * -35}px) scale(1.16)`;
        if (near) near.style.transform = `translate(${curr.current.x * -110}px,${curr.current.y * -55}px) scale(1.20)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 2, opacity, transition: "opacity 1400ms ease" }}
    >
      {/* FAR — moves least, most stable */}
      <div
        data-layer="far"
        className="absolute inset-[-12%] will-change-transform"
        style={{ transition: "transform 0.05s linear" }}
      >
        <Image src="/clouds-bg.JPG" alt="" fill className="object-cover"
          style={{ filter: "grayscale(55%) brightness(0.45)" }} priority />
      </div>

      {/* MID — medium speed, screen blend for wispy highlights */}
      <div
        data-layer="mid"
        className="absolute inset-[-16%] will-change-transform"
        style={{ transition: "transform 0.05s linear", mixBlendMode: "screen" }}
      >
        <Image src="/clouds-bg.JPG" alt="" fill className="object-cover"
          style={{ filter: "grayscale(80%) brightness(0.22) blur(3px)", transform: "scaleX(-1)" }} />
      </div>

      {/* NEAR — fastest, blurriest, most pronounced movement */}
      <div
        data-layer="near"
        className="absolute inset-[-20%] will-change-transform opacity-25"
        style={{ transition: "transform 0.05s linear", mixBlendMode: "screen" }}
      >
        <Image src="/clouds-bg.JPG" alt="" fill className="object-cover"
          style={{ filter: "grayscale(100%) brightness(0.5) blur(10px)", transform: "rotate(180deg)" }} />
      </div>

      <style>{`
        @keyframes cloudDrift {
          0%,100% { translate:0px 0px }
          33%     { translate:12px -7px }
          66%     { translate:-8px 6px }
        }
        [data-layer="far"] { animation: cloudDrift 24s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  LOGO REVEAL
// ─────────────────────────────────────────────────────────────
function LogoReveal({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="logo"
          initial={{ opacity: 0, scale: 0.74, filter: "blur(40px)" }}
          animate={{ opacity: 1, scale: 1,    filter: "blur(0px)"  }}
          transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            position:       "relative",
            userSelect:     "none",
            paddingBottom:  "2.5rem",
          }}
        >
          {/* Ambient halo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1   }}
            transition={{ duration: 3.8, ease: "easeOut", delay: 0.2 }}
            style={{
              position: "absolute", pointerEvents: "none",
              width: "clamp(340px,40vw,620px)", height: "clamp(340px,40vw,620px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)",
              filter: "blur(48px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }}
          />

          {/* Logo box */}
          <motion.div
            style={{
              position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
              width: "clamp(155px,18vw,245px)", height: "clamp(155px,18vw,245px)",
              background: "rgba(0,0,0,0.46)", backdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.10)",
              padding: "clamp(20px,2.5vw,40px)", flexShrink: 0,
            }}
            whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.26)" }}
            transition={{ duration: 0.5 }}
          >
            <Image src="/mainLogo.JPG" alt="Dalis Studios" width={165} height={165}
              className="object-contain relative z-10"
              style={{ filter: "brightness(1.18) drop-shadow(0 0 30px rgba(255,255,255,0.18))" }} />
          </motion.div>

          {/* Studio name */}
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 2.0, delay: 0.9, ease: [0.16,1,0.3,1] }}
            style={{
              marginTop: "2.5rem", color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(10px,0.8vw,13px)", letterSpacing: "0.52em",
              textTransform: "uppercase", fontWeight: 300,
              fontFamily: '"Helvetica Neue",Arial,sans-serif', whiteSpace: "nowrap",
            }}
          >
            Dalis&nbsp;Studios
          </motion.h2>

          {/* Rule */}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, delay: 1.4, ease: [0.16,1,0.3,1] }}
            style={{
              width: "clamp(38px,4.5vw,68px)", height: "1px",
              background: "rgba(255,255,255,0.22)", transformOrigin: "center", marginTop: "1.25rem",
            }}
          />

          {/* Tagline — explicit colors, never invisible */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 2.0, delay: 1.7 }}
            style={{
              marginTop: "1.25rem", maxWidth: "320px", textAlign: "center",
              fontWeight: 300, fontSize: "clamp(9px,0.7vw,11px)", letterSpacing: "0.16em",
              color: "rgba(200,200,200,1)",   // fully opaque, no partial alpha
              fontFamily: '"Helvetica Neue",Arial,sans-serif', lineHeight: 1.9,
            }}
          >
            A curation of{" "}
            <em style={{ fontStyle: "italic", color: "rgba(230,230,230,1)", fontFamily: "Georgia,serif" }}>
              silent authority
            </em>{" "}
            in form and function.
          </motion.p>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 2.3 }}
            whileHover={{ scale: 1.04, backgroundColor: "white", color: "black" }}
            style={{
              marginTop: "3rem",
              border: "1px solid rgba(255,255,255,0.28)",
              padding: "14px 56px", textTransform: "uppercase",
              color: "rgba(255,255,255,1)",   // fully opaque
              background: "transparent", backdropFilter: "blur(8px)",
              fontSize: "clamp(9px,0.7vw,11px)", letterSpacing: "0.30em",
              fontFamily: '"Helvetica Neue",Arial,sans-serif',
              cursor: "pointer", transition: "all 500ms",
              pointerEvents: "auto", flexShrink: 0,
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
//  SCROLL HINT
// ─────────────────────────────────────────────────────────────
function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{ duration: 1.4, delay: 0.5 }}
          style={{
            position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
            pointerEvents: "none", zIndex: 25,
          }}
        >
          <span style={{
            fontSize: "8px", letterSpacing: "0.42em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.30)", fontFamily: '"Helvetica Neue",Arial,sans-serif',
          }}>
            Scroll to reveal
          </span>
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "1px", height: "36px", background: "linear-gradient(to bottom,rgba(255,255,255,0.30),transparent)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
//  LOADING SPINNER  (shown while WebGL boots)
// ─────────────────────────────────────────────────────────────
function Loader({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: "absolute", inset: 0, zIndex: 50,
            background: "#020202", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "20px",
          }}
        >
          {/* Minimal spinner ring */}
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTopColor: "rgba(255,255,255,0.5)",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{
            fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)", fontFamily: '"Helvetica Neue",Arial,sans-serif',
          }}>
            Loading
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────
const CloudyLogoReveal = () => {
  const outerRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<ThreeSceneHandle | null>(null);

  const [liveProgress, setLiveProgress] = useState(0);
  const [revealed,     setRevealed]     = useState(false);
  const [cloudOpacity, setCloudOpacity] = useState(0);
  const [loading,      setLoading]      = useState(true);

  // ── Scroll progress ──────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping:   26,
    restDelta: 0.0005,
  });

  useEffect(() => {
    return smoothed.on("change", (v) => {
      sceneRef.current?.setProgress(v);
    });
  }, [smoothed]);

  // ── Kill loading state after short delay (WebGL ready) ───────
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // ── React to progress ────────────────────────────────────────
  const handleProgressChange = useCallback((p: number) => {
    setLiveProgress(p);

    // Cloud fades in from 0.72
    if (p >= 0.72) {
      const t = Math.min((p - 0.72) / (1 - 0.72), 1);
      setCloudOpacity(t * 0.62);
    } else {
      setCloudOpacity(0);
    }

    // Reveal / un-reveal logo (supports scroll-back)
    setRevealed(p >= LOGO_AT);
  }, []);

  // ── Scroll lock until logo is revealed ───────────────────────
  useScrollLock(outerRef, !revealed);

  return (
    <div ref={outerRef} style={{ height: SCROLL_DISTANCE }} className="relative">
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ background: "#020202" }}
      >
        {/* Loading screen */}
        <Loader visible={loading} />

        {/* z:0 — WebGL scene */}
        <ThreeScene sceneRef={sceneRef} onProgressChange={handleProgressChange} />

        {/* z:2 — Cloud image parallax */}
        <CloudLayer opacity={cloudOpacity} />

        {/* z:3 — Radial vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 3,
          background: "radial-gradient(ellipse 88% 88% at 50% 50%, transparent 22%, rgba(0,0,0,0.88) 100%)",
        }} />

        {/* z:4 — Film grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
          zIndex: 4,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          mixBlendMode: "overlay",
        }} />

        {/* z:20 — Logo, centered with safe padding */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{
          zIndex: 20,
          pointerEvents: revealed ? "auto" : "none",
          padding: "0 24px",
        }}>
          <LogoReveal visible={revealed} />
        </div>

        {/* z:25 — Scroll hint */}
        <ScrollHint visible={liveProgress < 0.04} />

        {/* z:20 — Corner label */}
        <div className="absolute bottom-8 w-full flex justify-end px-12 pointer-events-none" style={{ zIndex: 20 }}>
          <span style={{
            fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.14)", fontFamily: '"Helvetica Neue",Arial,sans-serif',
          }}>
            how the studio works
          </span>
        </div>

        {/* z:30 — Scroll progress bar */}
        {liveProgress < 0.99 && (
          <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{
            zIndex: 30, background: "rgba(255,255,255,0.04)",
          }}>
            <div style={{
              height: "100%", background: "rgba(255,255,255,0.28)",
              width: `${liveProgress * 100}%`,
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudyLogoReveal;