"use client";

import { useRef, useState } from "react";
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

export default function PeripheryPage() {
  const [schedule] = useState<FlashEvent[]>(() =>
    generateFlashSchedule(FLASH_COUNT, DURATION_SECONDS),
  );
  const emitted = useRef<Set<number>>(new Set());

  const template: GameTemplate<PeripherySample, PeripheryResult> = {
    name: "periphery",
    setup: {
      title: "The Periphery",
      description: "Read the words at the center. Notice what you notice.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
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
    <GameRunner template={template}>
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
