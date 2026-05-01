"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
  children: (ctx: {
    phase: GamePhase;
    progress: number;
    /** End the game early; computes result and navigates as if the timer fired. */
    end: () => void;
    /** Append a sample directly (event-driven games that don't use per-frame `sample`). */
    pushSample: (sample: TSample) => void;
  }) => ReactNode;
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

  // Latest template accessible from stable callbacks below without re-creating them on every render.
  const templateRef = useRef(template);
  templateRef.current = template;

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

  const finish = useCallback(() => {
    setPhase("end");
    const t = templateRef.current;
    const result = t.end.computeResult(samples.current);
    try {
      localStorage.setItem(storageKey(t.name), JSON.stringify(result));
    } catch {
      // localStorage may be unavailable (private mode); skip persistence.
    }
    router.push(nextRoute(t.end.next));
  }, [router]);

  const end = useCallback(() => {
    if (!sampling.current) return;
    sampling.current = false;
    finish();
  }, [finish]);

  const pushSample = useCallback((s: TSample) => {
    if (!sampling.current) return;
    samples.current.push(s);
  }, []);

  const handleStart = () => {
    if (phase !== "setup") return;
    setPhase("play");

    const startedAt = performance.now();
    const durationMs = templateRef.current.play.durationSeconds * 1000;
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
      const s = templateRef.current.play.sample(ctx);
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

  return (
    <div
      className={`relative min-h-screen bg-[#0a0e14] overflow-hidden flex items-center justify-center ${
        cursor === "auto" ? "cursor-auto" : "cursor-none"
      }`}
    >
      {children({ phase, progress, end, pushSample })}

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
