"use client";

import { CSSProperties } from "react";
import {
  GamePhase,
  PeripheryCorner,
  PeripheryShape,
} from "@/lib/game-template";

export interface FlashEvent {
  time: number;
  corner: PeripheryCorner;
  shape: PeripheryShape;
}

const POEM_LINES = [
  "Read this slowly.",
  "Let your eyes rest.",
  "Notice the edges.",
  "Stay here.",
];
const WINDOW_SECONDS = 5;
const FADE_RATIO = 0.2;
const FLASH_DURATION = 0.3;
const CORNERS: PeripheryCorner[] = ["tl", "tr", "bl", "br"];
const SHAPES: PeripheryShape[] = ["★", "○", "△", "◇"];

export function generateFlashSchedule(
  count: number,
  totalSeconds: number,
): FlashEvent[] {
  const events: FlashEvent[] = [];
  let t = 2 + Math.random() * 2;
  for (let i = 0; i < count; i++) {
    if (t > totalSeconds - 1) break;
    events.push({
      time: t,
      corner: CORNERS[Math.floor(Math.random() * CORNERS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    });
    t += 4 + Math.random() * 3;
  }
  return events;
}

function cornerStyle(corner: PeripheryCorner): CSSProperties {
  const offset = "12%";
  switch (corner) {
    case "tl":
      return { top: offset, left: offset };
    case "tr":
      return { top: offset, right: offset };
    case "bl":
      return { bottom: offset, left: offset };
    case "br":
      return { bottom: offset, right: offset };
  }
}

interface PeripherySceneProps {
  phase: GamePhase;
  progress: number;
  schedule: FlashEvent[];
  duration: number;
}

export function PeripheryScene({
  phase,
  progress,
  schedule,
  duration,
}: PeripherySceneProps) {
  if (phase === "setup") return null;

  const elapsed = progress * duration;
  const lineIndex =
    Math.floor(elapsed / WINDOW_SECONDS) % POEM_LINES.length;
  const t = (elapsed % WINDOW_SECONDS) / WINDOW_SECONDS;
  let lineOpacity: number;
  if (t < FADE_RATIO) lineOpacity = t / FADE_RATIO;
  else if (t > 1 - FADE_RATIO) lineOpacity = (1 - t) / FADE_RATIO;
  else lineOpacity = 1;
  lineOpacity = Math.max(0, Math.min(1, lineOpacity)) * 0.85;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <span
          key={lineIndex}
          style={{
            opacity: lineOpacity,
            fontFamily: "var(--font-eb-garamond)",
            fontWeight: 400,
          }}
          className="text-2xl sm:text-3xl text-[#e0dfdb] italic tracking-wide text-center"
        >
          {POEM_LINES[lineIndex]}
        </span>
      </div>

      {schedule.map((event, i) => {
        const visible =
          elapsed >= event.time && elapsed < event.time + FLASH_DURATION;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              ...cornerStyle(event.corner),
              opacity: visible ? 0.9 : 0,
              transition: "opacity 80ms ease-in-out",
              fontSize: "1.75rem",
              color: "#e0dfdb",
              textShadow: "0 0 12px rgba(224,223,219,0.4)",
            }}
          >
            {event.shape}
          </span>
        );
      })}
    </div>
  );
}
