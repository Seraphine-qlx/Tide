"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tone from "tone";
import { GameRunner } from "@/components/GameRunner";
import {
  GameTemplate,
  PulseResult,
  PulseSample,
} from "@/lib/game-template";

const DURATION_SECONDS = 30;
const CIRCLE_PX = 200;
const MASTER_DB = -6;

const C3_HZ = Tone.Frequency("C3").toFrequency();
const C3_MIDI = Tone.Frequency("C3").toMidi();
const C4_MIDI = Tone.Frequency("C4").toMidi();

/** Map an inter-tap interval (ms) to a pitch in Hz. 200 ms → C4, 2000 ms → C3. */
function intervalToHz(ms: number | null): number {
  if (ms === null) return C3_HZ;
  const clamped = Math.max(200, Math.min(2000, ms));
  const t = (clamped - 200) / (2000 - 200);
  // Interpolate in midi space so the pitch falls perceptually linearly.
  const midi = C4_MIDI + (C3_MIDI - C4_MIDI) * t;
  return Tone.Frequency(midi, "midi").toFrequency();
}

export default function PulsePage() {
  const tapQueue = useRef<number[]>([]);
  const activeRef = useRef(false);
  const [ripples, setRipples] = useState<number[]>([]);

  const synthRef = useRef<Tone.Synth | null>(null);
  const lastTapRef = useRef<number | null>(null);
  const pulseStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      try {
        synthRef.current?.dispose();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleStart = () => {
    pulseStartRef.current = performance.now();
    Tone.start().then(() => {
      console.log("Tone started successfully");
      Tone.getDestination().volume.value = MASTER_DB;
      try {
        const synth = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.6 },
        }).toDestination();
        synth.volume.value = -28;
        synthRef.current = synth;
      } catch {
        // ignore
      }
    });
  };

  const handleTap = () => {
    if (!activeRef.current) return;
    const ts = performance.now();
    tapQueue.current.push(ts);

    const interval = lastTapRef.current === null ? null : ts - lastTapRef.current;
    const hz = intervalToHz(interval);
    lastTapRef.current = ts;
    try {
      synthRef.current?.triggerAttackRelease(hz, 0.6);
    } catch {
      // ignore
    }

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
      instruction: "Tap whenever you feel moved to.",
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
        try {
          const start = pulseStartRef.current;
          const relative = timestamps.map((t) => t - start);
          localStorage.setItem(
            "tide_pulse_timestamps",
            JSON.stringify(relative),
          );
        } catch {
          // localStorage may be unavailable; timestamps are best-effort.
        }
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
    <GameRunner template={template} cursor="auto" onStart={handleStart}>
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
