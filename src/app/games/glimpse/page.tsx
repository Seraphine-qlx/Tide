"use client";

import { GameRunner } from "@/components/GameRunner";
import {
  GameTemplate,
  GlimpseChoice,
  GlimpseResult,
} from "@/lib/game-template";
import { GlimpseScene } from "./scene";

const DURATION_SECONDS = 20;

export default function GlimpsePage() {
  const template: GameTemplate<GlimpseChoice, GlimpseResult> = {
    name: "glimpse",
    setup: {
      title: "The Glimpse",
      description: "A brief image will appear. Trust your first impression.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      // Event-driven: choices are pushed via pushSample from the scene.
      sample: () => null,
    },
    end: {
      next: "current",
      computeResult: (samples) => {
        const counts: GlimpseResult = {
          whole: 0,
          detail: 0,
          mood: 0,
          structure: 0,
        };
        for (const c of samples) counts[c]++;
        return counts;
      },
    },
  };

  return (
    <GameRunner template={template} cursor="auto">
      {({ phase, end, pushSample }) => (
        <GlimpseScene
          phase={phase}
          onChoice={pushSample}
          onComplete={end}
        />
      )}
    </GameRunner>
  );
}
