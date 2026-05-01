"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import { GameRunner } from "@/components/GameRunner";
import {
  DriftResult,
  DriftSample,
  GameTemplate,
} from "@/lib/game-template";

const DURATION_SECONDS = 30;
const WAYPOINTS = 8;

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

  const template: GameTemplate<DriftSample, DriftResult> = {
    name: "drift",
    setup: {
      title: "The Drift",
      description: "Follow the light. Or don't. Just notice.",
    },
    play: {
      durationSeconds: DURATION_SECONDS,
      sample: ({ mouse }) => {
        const el = dotRef.current;
        if (!el || !mouse) return null;
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - mouse.x;
        const dy = r.top + r.height / 2 - mouse.y;
        return { distance: Math.hypot(dx, dy) };
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
    <GameRunner template={template}>
      {({ phase }) => <DriftDot active={phase === "play"} dotRef={dotRef} />}
    </GameRunner>
  );
}
