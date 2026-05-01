"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameRunner } from "@/components/GameRunner";
import {
  GameTemplate,
  PulseResult,
  PulseSample,
} from "@/lib/game-template";

const DURATION_SECONDS = 30;
const CIRCLE_PX = 200;

export default function PulsePage() {
  // Taps land in this queue from click events; sample() drains one per frame
  // so the GameRunner samples buffer ends up holding the timestamps.
  const tapQueue = useRef<number[]>([]);
  const activeRef = useRef(false);
  const [ripples, setRipples] = useState<number[]>([]);

  const handleTap = () => {
    if (!activeRef.current) return;
    const ts = performance.now();
    tapQueue.current.push(ts);
    const id = ts + Math.random();
    setRipples((prev) => [...prev, id]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id));
    }, 1100);
  };

  const template: GameTemplate<PulseSample, PulseResult> = {
    name: "pulse",
    setup: {
      title: "The Pulse",
      description: "In your own rhythm, tap the circle.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      sample: () => {
        if (tapQueue.current.length > 0) {
          return tapQueue.current.shift()!;
        }
        return null;
      },
    },
    end: {
      next: "glimpse",
      computeResult: (timestamps) => {
        const tapCount = timestamps.length;
        if (tapCount < 2) {
          return { tapCount, meanInterval: 0, intervalVariance: 0 };
        }
        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
          intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const n = intervals.length;
        const mean = intervals.reduce((a, b) => a + b, 0) / n;
        const variance =
          intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        return { tapCount, meanInterval: mean, intervalVariance: variance };
      },
    },
  };

  return (
    <GameRunner template={template} cursor="auto">
      {({ phase, progress }) => {
        activeRef.current = phase === "play";
        const remaining = Math.max(
          0,
          Math.ceil(DURATION_SECONDS * (1 - progress)),
        );
        return (
          <>
            <button
              onClick={handleTap}
              aria-label="Pulse"
              className="relative cursor-pointer focus:outline-none"
              style={{
                width: CIRCLE_PX,
                height: CIRCLE_PX,
                borderRadius: "50%",
                background: "#e0dfdb",
                boxShadow:
                  "0 0 60px 16px rgba(224,223,219,0.35), 0 0 140px 30px rgba(224,223,219,0.15)",
              }}
            >
              <AnimatePresence>
                {ripples.map((id) => (
                  <motion.span
                    key={id}
                    initial={{ scale: 0.95, opacity: 0.55 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 rounded-full border border-[#e0dfdb]"
                  />
                ))}
              </AnimatePresence>
            </button>

            {phase === "play" && (
              <div className="pointer-events-none absolute bottom-6 right-8 text-xs text-[#e0dfdb]/30 tracking-[0.3em] font-[family-name:var(--font-eb-garamond)]">
                {String(remaining).padStart(2, "0")}
              </div>
            )}
          </>
        );
      }}
    </GameRunner>
  );
}
