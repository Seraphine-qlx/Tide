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
  /** Cursor for the play surface. Defaults to "none" — games that need the
   *  cursor visible (Pulse, Glimpse, Current) opt into "auto", and Drift uses
   *  "crosshair" so the user always knows where their pointer is. */
  cursor?: "none" | "auto" | "crosshair";
  /** Fires synchronously inside the Start click handler — use this to call
   *  `Tone.start()` or any other API that requires a user-gesture context. */
  onStart?: () => void;
}

const CURSOR_CLASS: Record<NonNullable<GameRunnerProps<unknown, unknown>["cursor"]>, string> = {
  none: "cursor-none",
  auto: "cursor-auto",
  crosshair: "cursor-crosshair",
};

export function GameRunner<TSample, TResult>({
  template,
  children,
  cursor = "none",
  onStart,
}: GameRunnerProps<TSample, TResult>) {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [progress, setProgress] = useState(0);
  const [showInstruction, setShowInstruction] = useState(false);

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
    // Run inside this user-gesture context so callers can unlock audio etc.
    onStart?.();
    setPhase("play");
    if (templateRef.current.play.instruction) {
      setShowInstruction(true);
      setTimeout(() => setShowInstruction(false), 3000);
    }

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
      className={`relative min-h-screen bg-[#0a0e14] overflow-hidden flex items-center justify-center ${CURSOR_CLASS[cursor]}`}
    >
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="fixed top-4 left-4 z-50 p-2 text-[#e0dfdb]/40 hover:text-[#e0dfdb]/80 transition-opacity duration-300 cursor-pointer focus:outline-none"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 4 L6 10 L12 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {children({ phase, progress, end, pushSample })}

      <AnimatePresence>
        {showInstruction && template.play.instruction && (
          <motion.div
            key="instruction"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.6,
              transition: { duration: 0.5, ease: "easeInOut" },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 1, ease: "easeInOut" },
            }}
            className="fixed bottom-12 left-0 w-full text-center text-sm italic font-[family-name:var(--font-eb-garamond)] text-[#e0dfdb] pointer-events-none"
          >
            {template.play.instruction}
          </motion.div>
        )}
      </AnimatePresence>

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
