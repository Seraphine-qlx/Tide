"use client";

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

export default function CurrentPage() {
  const template: GameTemplate<CurrentSample, CurrentResult> = {
    name: "current",
    setup: {
      title: "The Current",
      description: "Follow whatever draws you. You can change focus anytime.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      // Event-driven: hover sessions are pushed via pushSample from the scene.
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
    <GameRunner template={template} cursor="auto">
      {({ phase, progress, pushSample }) => {
        const remaining = Math.max(
          0,
          Math.ceil(DURATION_SECONDS * (1 - progress)),
        );
        return (
          <>
            <CurrentScene phase={phase} onSample={pushSample} />
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
