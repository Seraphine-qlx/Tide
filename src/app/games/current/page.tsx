"use client";

import { useEffect, useRef } from "react";
import * as Tone from "tone";
import { GameRunner } from "@/components/GameRunner";
import {
  CurrentResult,
  CurrentSample,
  CurrentType,
  GameTemplate,
} from "@/lib/game-template";
import { CurrentScene } from "./scene";

const DURATION_SECONDS = 40;
const TYPES: CurrentType[] = [
  "poem",
  "color",
  "shape",
  "symbol",
  "line",
  "circle",
];

const NOTES: Record<CurrentType, string> = {
  poem: "C3",
  color: "E3",
  shape: "G3",
  symbol: "B3",
  line: "D4",
  circle: "F4",
};

/** Effective silence — Tone.js handles -Infinity but ramping toward it can stall. */
const SILENT_DB = -80;
const ACTIVE_DB = -30;
const MASTER_DB = -6;

export default function CurrentPage() {
  const synthsRef = useRef<Partial<Record<CurrentType, Tone.Synth>>>({});

  useEffect(() => {
    return () => {
      const synths = synthsRef.current;
      try {
        for (const type of TYPES) {
          synths[type]?.triggerRelease();
          synths[type]?.dispose();
        }
      } catch {
        // ignore
      }
      synthsRef.current = {};
    };
  }, []);

  const handleStart = () => {
    Tone.start().then(() => {
      console.log("Tone started successfully");
      Tone.getDestination().volume.value = MASTER_DB;
      try {
        const synths: Partial<Record<CurrentType, Tone.Synth>> = {};
        for (const type of TYPES) {
          const synth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.4, decay: 0.2, sustain: 1, release: 0.6 },
          }).toDestination();
          synth.volume.value = SILENT_DB;
          synth.triggerAttack(NOTES[type]);
          synths[type] = synth;
        }
        synthsRef.current = synths;
      } catch {
        // ignore
      }
    });
  };

  const handleHover = (type: CurrentType, hovering: boolean) => {
    const synth = synthsRef.current[type];
    if (!synth) return;
    try {
      synth.volume.rampTo(
        hovering ? ACTIVE_DB : SILENT_DB,
        hovering ? 0.4 : 0.6,
      );
    } catch {
      // ignore
    }
  };

  const template: GameTemplate<CurrentSample, CurrentResult> = {
    name: "current",
    setup: {
      title: "The Current",
      description: "Follow whatever draws you. You can change focus anytime.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      instruction: "Rest your cursor on whatever catches your eye.",
      sample: () => null,
    },
    end: {
      next: "/result",
      computeResult: (samples) => {
        const totalDwell = samples.reduce((a, s) => a + s.durationMs, 0);
        const switches = Math.max(0, samples.length - 1);
        const longestDwell = samples.reduce(
          (max, s) => Math.max(max, s.durationMs),
          0,
        );

        const totalsByType: Record<CurrentType, number> = {
          poem: 0,
          color: 0,
          shape: 0,
          symbol: 0,
          line: 0,
          circle: 0,
        };
        for (const s of samples) totalsByType[s.type] += s.durationMs;

        let preferredType: CurrentType | null = null;
        let max = 0;
        for (const t of TYPES) {
          if (totalsByType[t] > max) {
            max = totalsByType[t];
            preferredType = t;
          }
        }

        return { totalDwell, switches, longestDwell, preferredType };
      },
    },
  };

  return (
    <GameRunner template={template} cursor="auto" onStart={handleStart}>
      {({ phase, progress, pushSample }) => {
        const remaining = Math.max(
          0,
          Math.ceil(DURATION_SECONDS * (1 - progress)),
        );
        return (
          <>
            <CurrentScene
              phase={phase}
              onSample={pushSample}
              onHover={handleHover}
            />
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
