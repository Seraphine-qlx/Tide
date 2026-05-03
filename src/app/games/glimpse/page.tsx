"use client";

import { useEffect, useRef } from "react";
import * as Tone from "tone";
import { GameRunner } from "@/components/GameRunner";
import {
  GameTemplate,
  GlimpseChoice,
  GlimpseResult,
} from "@/lib/game-template";
import { GlimpseScene } from "./scene";

const DURATION_SECONDS = 20;
const IMAGE_NOTES = ["G2", "B2", "D3"] as const;
const MASTER_DB = -6;

export default function GlimpsePage() {
  const synthRef = useRef<Tone.Synth | null>(null);

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
    Tone.start().then(() => {
      console.log("Tone started successfully");
      Tone.getDestination().volume.value = MASTER_DB;
      try {
        const synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 1.5 },
        }).toDestination();
        synth.volume.value = -32;
        synthRef.current = synth;
      } catch {
        // ignore
      }
    });
  };

  const handleImageStart = (index: number) => {
    const note = IMAGE_NOTES[index] ?? IMAGE_NOTES[0];
    try {
      synthRef.current?.triggerAttackRelease(note, 1.4);
    } catch {
      // ignore
    }
  };

  const template: GameTemplate<GlimpseChoice, GlimpseResult> = {
    name: "glimpse",
    setup: {
      title: "The Glimpse",
      description: "A brief image will appear. Trust your first impression.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      instruction: "Notice what draws you first.",
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
    <GameRunner template={template} cursor="auto" onStart={handleStart}>
      {({ phase, end, pushSample }) => (
        <GlimpseScene
          phase={phase}
          onChoice={pushSample}
          onComplete={end}
          onImageStart={handleImageStart}
        />
      )}
    </GameRunner>
  );
}
