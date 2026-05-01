"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  GamePhase,
  GameSampleContext,
  GameTemplate,
  nextRoute,
  storageKey,
} from "@/lib/game-template";

interface GameRunnerProps<TSample, TResult> {
  template: GameTemplate<TSample, TResult>;
  children: (ctx: { phase: GamePhase; progress: number }) => ReactNode;
  /** Cursor visibility for the play surface. Defaults to "none" so games that
   *  feel best with the cursor hidden (Drift, Periphery) stay that way. */
  cursor?: "none" | "auto";
}

export function GameRunner<TSample, TResult>({
  template,
  children,
  cursor = "none",
}: GameRunnerProps<TSample, TResult>) {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [progress, setProgress] = useState(0);

  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const samples = useRef<TSample[]>([]);
  const sampling = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      sampling.current = false;
    };
  }, []);

  const handleStart = () => {
    if (phase !== "setup") return;
    setPhase("play");

    const startedAt = performance.now();
    const durationMs = template.play.durationSeconds * 1000;
    sampling.current = true;

    const tick = (now: number) => {
      if (!sampling.current) return;
      const elapsedMs = now - startedAt;
      const p = Math.min(1, elapsedMs / durationMs);
      setProgress(p);

      const ctx: GameSampleContext = {
        elapsed: elapsedMs / 1000,
        progress: p,
        mouse: mousePos.current,
        now,
      };
      const s = template.play.sample(ctx);
      if (s != null) samples.current.push(s);

      if (elapsedMs >= durationMs) {
        sampling.current = false;
        finish();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const finish = () => {
    setPhase("end");
    const result = template.end.computeResult(samples.current);
    try {
      localStorage.setItem(storageKey(template.name), JSON.stringify(result));
    } catch {
      // localStorage may be unavailable (private mode); skip persistence.
    }
    router.push(nextRoute(template.end.next));
  };

  return (
    <div
      className={`relative min-h-screen bg-[#0a0e14] overflow-hidden flex items-center justify-center ${
        cursor === "auto" ? "cursor-auto" : "cursor-none"
      }`}
    >
      {children({ phase, progress })}

      <AnimatePresence>
        {phase === "setup" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="absolute bottom-[18%] flex flex-col items-center gap-8 text-center cursor-auto px-6"
          >
            <h1
              className="font-[family-name:var(--font-eb-garamond)] text-4xl sm:text-5xl text-[#e0dfdb] tracking-wide"
              style={{ fontWeight: 500 }}
            >
              {template.setup.title}
            </h1>
            {template.setup.description && (
              <p className="max-w-md text-sm sm:text-base italic text-[#e0dfdb]/60 leading-relaxed">
                {template.setup.description}
              </p>
            )}
            <button
              onClick={handleStart}
              className="px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03]"
            >
              {template.setup.startLabel ?? "Start"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
