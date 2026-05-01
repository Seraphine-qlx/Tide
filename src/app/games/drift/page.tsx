"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimate, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const DURATION_SECONDS = 30;
const WAYPOINTS = 8;

function generateWaypoints(steps: number, maxRadius: number) {
  const xs: number[] = [0];
  const ys: number[] = [0];
  for (let i = 1; i < steps; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = (0.4 + Math.random() * 0.6) * maxRadius;
    xs.push(Math.cos(angle) * r);
    ys.push(Math.sin(angle) * r);
  }
  xs.push(0);
  ys.push(0);
  return { xs, ys };
}

export default function DriftGame() {
  const router = useRouter();
  const [scope, animate] = useAnimate();
  const [started, setStarted] = useState(false);

  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const samples = useRef<number[]>([]);
  const samplingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      samplingRef.current = false;
    };
  }, []);

  const handleStart = async () => {
    if (started) return;
    setStarted(true);

    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
    const { xs, ys } = generateWaypoints(WAYPOINTS, maxRadius);
    const times = xs.map((_, i) => i / (xs.length - 1));
    const easeArr = Array(xs.length - 1).fill("easeInOut");

    samplingRef.current = true;
    const sampleLoop = () => {
      if (!samplingRef.current) return;
      const el = scope.current as HTMLElement | null;
      if (el && mousePos.current) {
        const rect = el.getBoundingClientRect();
        const dotX = rect.left + rect.width / 2;
        const dotY = rect.top + rect.height / 2;
        const dx = dotX - mousePos.current.x;
        const dy = dotY - mousePos.current.y;
        samples.current.push(Math.hypot(dx, dy));
      }
      requestAnimationFrame(sampleLoop);
    };
    requestAnimationFrame(sampleLoop);

    await animate(
      scope.current,
      { x: xs, y: ys },
      { duration: DURATION_SECONDS, times, ease: easeArr }
    );

    samplingRef.current = false;

    const arr = samples.current;
    if (arr.length > 0) {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance =
        arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
      localStorage.setItem(
        "tide_drift_result",
        JSON.stringify({ meanDistance: mean, distanceVariance: variance })
      );
    }

    router.push("/games/periphery");
  };

  return (
    <div className="relative min-h-screen bg-[#0a0e14] overflow-hidden flex items-center justify-center cursor-none">
      <motion.div
        ref={scope}
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#e0dfdb",
          boxShadow:
            "0 0 24px 6px rgba(224,223,219,0.45), 0 0 64px 14px rgba(224,223,219,0.18)",
        }}
      />

      <AnimatePresence>
        {!started && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="absolute bottom-[18%] flex flex-col items-center gap-8 text-center cursor-auto"
          >
            <h1
              className="font-[family-name:var(--font-eb-garamond)] text-4xl sm:text-5xl text-[#e0dfdb] tracking-wide"
              style={{ fontWeight: 500 }}
            >
              The Drift
            </h1>
            <button
              onClick={handleStart}
              className="px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03]"
            >
              Start
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
