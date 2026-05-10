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

const NOTES_BY_TYPE: Record<CurrentType, string> = {
  poem: "C4",
  color: "D4",
  shape: "E4",
  symbol: "G4",
  line: "A4",
  circle: "C5",
};

export default function CurrentPage() {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);

  useEffect(() => {
    const filter = new Tone.Filter(2000, "lowpass").toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.4,
        decay: 0.2,
        sustain: 0.6,
        release: 1.5,
      },
      volume: -22,
    }).connect(filter);
    synthRef.current = synth;
    filterRef.current = filter;

    return () => {
      try {
        synth.releaseAll();
        synth.dispose();
        filter.dispose();
      } catch {
        // ignore
      }
      synthRef.current = null;
      filterRef.current = null;
    };
  }, []);

  const handleStart = () => {
    Tone.start().catch(() => {
      // ignore — the lazy check in handleHover will retry
    });
  };

  const handleHover = (type: CurrentType, hovering: boolean) => {
    const synth = synthRef.current;
    if (!synth) return;
    const note = NOTES_BY_TYPE[type];
    try {
      if (hovering) {
        if (Tone.context.state !== "running") {
          Tone.start().then(() => synth.triggerAttack(note)).catch(() => {});
          return;
        }
        synth.triggerAttack(note);
      } else {
        synth.triggerRelease(note);
      }
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
