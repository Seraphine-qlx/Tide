"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { GameRunner } from "@/components/GameRunner";
import {
  GameTemplate,
  PeripheryResult,
  PeripherySample,
} from "@/lib/game-template";
import {
  FlashEvent,
  PeripheryScene,
  generateFlashSchedule,
} from "./scene";

const DURATION_SECONDS = 25;
const FLASH_COUNT = 4;
const MASTER_DB = -6;

export default function PeripheryPage() {
  const [schedule] = useState<FlashEvent[]>(() =>
    generateFlashSchedule(FLASH_COUNT, DURATION_SECONDS),
  );
  const emitted = useRef<Set<number>>(new Set());
  const polyRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    return () => {
      const handle = polyRef.current;
      if (!handle) return;
      try {
        handle.releaseAll();
      } catch {
        // ignore
      }
      // Let the 3-second release tail play out before disposing so the
      // chord doesn't cut harshly when navigating away.
      setTimeout(() => {
        try {
          handle.dispose();
        } catch {
          // ignore
        }
      }, 3000);
    };
  }, []);

  const handleStart = () => {
    Tone.start().then(() => {
      console.log("Tone started successfully");
      Tone.getDestination().volume.value = MASTER_DB;
      try {
        const poly = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine" },
          envelope: { attack: 2, decay: 0.4, sustain: 0.7, release: 3 },
        }).toDestination();
        poly.volume.value = -38;
        poly.triggerAttack(["A2", "C3", "E3"]);
        polyRef.current = poly;
      } catch {
        // ignore
      }
    });
  };

  const template: GameTemplate<PeripherySample, PeripheryResult> = {
    name: "periphery",
    setup: {
      title: "The Periphery",
      description: "Read the words at the center. Notice what you notice.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      instruction: "Hold your gaze at the center.",
      sample: ({ elapsed }) => {
        for (let i = 0; i < schedule.length; i++) {
          if (!emitted.current.has(i) && elapsed >= schedule[i].time) {
            emitted.current.add(i);
            return { corner: schedule[i].corner, shape: schedule[i].shape };
          }
        }
        return null;
      },
    },
    end: {
      next: "periphery/quiz",
      computeResult: (samples) => ({ flashes: samples }),
    },
  };

  return (
    <GameRunner template={template} onStart={handleStart}>
      {({ phase, progress }) => (
        <PeripheryScene
          phase={phase}
          progress={progress}
          schedule={schedule}
          duration={DURATION_SECONDS}
        />
      )}
    </GameRunner>
  );
}
