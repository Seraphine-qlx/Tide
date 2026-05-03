"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import * as Tone from "tone";
import { GameRunner } from "@/components/GameRunner";
import {
  DriftResult,
  DriftSample,
  GameTemplate,
} from "@/lib/game-template";

const DURATION_SECONDS = 30;
const WAYPOINTS = 8;
const NEAR_DISTANCE_PX = 80;
const MASTER_DB = -6;

function generateWaypoints(steps: number, maxRadius: number) {
  const xs: number[] = [0];
  const ys: number[] = [0];
  for (let i = 1; i < steps; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = (0.4 + Math.random() * 0.6) * maxRadius;
    xs.push(Math.cos(angle) * r);
    ys.push(Math.sin(angle) * r);
  }
  xs.push(0);
  ys.push(0);
  return { xs, ys };
}

function DriftDot({
  active,
  dotRef,
}: {
  active: boolean;
  dotRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const started = useRef(false);

  useEffect(() => {
    dotRef.current = scope.current;
  }, [scope, dotRef]);

  useEffect(() => {
    if (!active || started.current || !scope.current) return;
    started.current = true;
    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
    const { xs, ys } = generateWaypoints(WAYPOINTS, maxRadius);
    const times = xs.map((_, i) => i / (xs.length - 1));
    const ease = Array(xs.length - 1).fill("easeInOut");
    animate(
      scope.current,
      { x: xs, y: ys },
      { duration: DURATION_SECONDS, times, ease },
    );
  }, [active, animate, scope]);

  return (
    <motion.div
      ref={scope}
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#e0dfdb",
        boxShadow:
          "0 0 24px 6px rgba(224,223,219,0.45), 0 0 64px 14px rgba(224,223,219,0.18)",
      }}
    />
  );
}

export default function DriftPage() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const distanceRef = useRef<number>(Number.POSITIVE_INFINITY);
  const synthRef = useRef<Tone.Synth | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      try {
        synthRef.current?.triggerRelease();
        synthRef.current?.dispose();
        vibratoRef.current?.dispose();
        filterRef.current?.dispose();
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
        const filter = new Tone.Filter({
          frequency: 400,
          type: "lowpass",
        }).toDestination();
        const vibrato = new Tone.Vibrato({
          frequency: 0.3,
          depth: 0.1,
        }).connect(filter);
        const synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 1.5, decay: 0, sustain: 1, release: 1.5 },
        }).connect(vibrato);
        synth.volume.value = -42;
        synth.triggerAttack(110);
        synthRef.current = synth;
        vibratoRef.current = vibrato;
        filterRef.current = filter;

        let lastZone: "near" | "far" | null = null;
        const tick = () => {
          const s = synthRef.current;
          if (s) {
            const zone: "near" | "far" =
              distanceRef.current < NEAR_DISTANCE_PX ? "near" : "far";
            if (zone !== lastZone) {
              try {
                s.volume.rampTo(zone === "near" ? -32 : -42, 0.5);
              } catch {
                // ignore
              }
              lastZone = zone;
            }
          }
          rafIdRef.current = requestAnimationFrame(tick);
        };
        rafIdRef.current = requestAnimationFrame(tick);
      } catch {
        // ignore
      }
    });
  };

  const template: GameTemplate<DriftSample, DriftResult> = {
    name: "drift",
    setup: {
      title: "The Drift",
      description: "Follow the light. Or don't. Just notice.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      instruction: "Follow the light.",
      sample: ({ mouse }) => {
        const el = dotRef.current;
        if (!el || !mouse) return null;
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - mouse.x;
        const dy = r.top + r.height / 2 - mouse.y;
        const distance = Math.hypot(dx, dy);
        distanceRef.current = distance;
        return { distance };
      },
    },
    end: {
      next: "periphery",
      computeResult: (samples) => {
        const ds = samples.map((s) => s.distance);
        const n = Math.max(ds.length, 1);
        const mean = ds.reduce((a, b) => a + b, 0) / n;
        const variance = ds.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        return { meanDistance: mean, distanceVariance: variance };
      },
    },
  };

  return (
    <GameRunner
      template={template}
      cursor="crosshair"
      onStart={handleStart}
    >
      {({ phase }) => <DriftDot active={phase === "play"} dotRef={dotRef} />}
    </GameRunner>
  );
}
