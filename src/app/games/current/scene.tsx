"use client";

import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CurrentType, GamePhase } from "@/lib/game-template";

const FLOAT_DURATION = 50;
const FLOAT_RADIUS = 70;
const MIN_DWELL_MS = 50;

const ANCHORS: Record<CurrentType, { x: string; y: string }> = {
  poem: { x: "10%", y: "20%" },
  color: { x: "62%", y: "12%" },
  shape: { x: "42%", y: "38%" },
  symbol: { x: "8%", y: "65%" },
  line: { x: "62%", y: "60%" },
  circle: { x: "40%", y: "78%" },
};

interface Waypoints {
  xs: number[];
  ys: number[];
}

function generateWaypoints(): Waypoints {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    points.push({
      x: (Math.random() - 0.5) * FLOAT_RADIUS * 2,
      y: (Math.random() - 0.5) * FLOAT_RADIUS * 2,
    });
  }
  points.push(points[0]);
  return { xs: points.map((p) => p.x), ys: points.map((p) => p.y) };
}

interface FloatingProps {
  type: CurrentType;
  waypoints: Waypoints;
  onHoverStart: (t: CurrentType) => void;
  onHoverEnd: (t: CurrentType) => void;
  children: ReactNode;
}

function Floating({
  type,
  waypoints,
  onHoverStart,
  onHoverEnd,
  children,
}: FloatingProps) {
  const anchor = ANCHORS[type];
  return (
    <motion.div
      className="group absolute pointer-events-auto cursor-pointer"
      style={{ top: anchor.y, left: anchor.x }}
      initial={{ x: waypoints.xs[0], y: waypoints.ys[0], scale: 1 }}
      animate={{ x: waypoints.xs, y: waypoints.ys }}
      whileHover={{ scale: 1.05 }}
      transition={{
        default: { duration: 0.4, ease: "easeInOut" },
        x: { duration: FLOAT_DURATION, repeat: Infinity, ease: "easeInOut" },
        y: { duration: FLOAT_DURATION, repeat: Infinity, ease: "easeInOut" },
      }}
      onHoverStart={() => onHoverStart(type)}
      onHoverEnd={() => onHoverEnd(type)}
    >
      <div className="transition-[filter] duration-500 ease-in-out group-hover:drop-shadow-[0_0_18px_rgba(224,223,219,0.4)]">
        {children}
      </div>
    </motion.div>
  );
}

function PoemContent() {
  return (
    <div className="text-[#e0dfdb]/70 italic font-[family-name:var(--font-eb-garamond)] text-base sm:text-lg leading-relaxed text-center max-w-[260px]">
      the light bends
      <br />
      around what it cannot hold
    </div>
  );
}

function ColorContent() {
  return (
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(140,120,200,0.55) 0%, rgba(120,140,200,0.18) 65%, transparent 100%)",
        filter: "blur(6px)",
      }}
    />
  );
}

function ShapeContent() {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="-60 -60 120 120"
      animate={{ rotate: 360 }}
      transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
    >
      <polygon
        points="0,-44 38,22 -38,22"
        stroke="#e0dfdb"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      <polygon
        points="0,44 -38,-22 38,-22"
        stroke="#e0dfdb"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <circle cx="0" cy="0" r="6" fill="#e0dfdb" opacity="0.5" />
    </motion.svg>
  );
}

function SymbolContent() {
  return (
    <div className="text-[#e0dfdb]/65 text-2xl sm:text-3xl tracking-[0.5em] font-[family-name:var(--font-eb-garamond)]">
      ∿ ⊹ ⌇ ∴ ⋯
    </div>
  );
}

function LineContent() {
  return (
    <motion.svg
      width="220"
      height="80"
      viewBox="0 0 220 80"
      animate={{ scaleY: [1, 0.6, 1.4, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M 10 40 Q 65 10 110 40 T 210 40"
        stroke="#e0dfdb"
        strokeWidth="1.2"
        fill="none"
        opacity="0.55"
      />
    </motion.svg>
  );
}

function CircleContent() {
  return (
    <motion.div
      style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        border: "1px solid rgba(224,223,219,0.55)",
      }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function renderContent(type: CurrentType) {
  switch (type) {
    case "poem":
      return <PoemContent />;
    case "color":
      return <ColorContent />;
    case "shape":
      return <ShapeContent />;
    case "symbol":
      return <SymbolContent />;
    case "line":
      return <LineContent />;
    case "circle":
      return <CircleContent />;
  }
}

const TYPES: CurrentType[] = [
  "poem",
  "color",
  "shape",
  "symbol",
  "line",
  "circle",
];

interface CurrentSceneProps {
  phase: GamePhase;
  onSample: (sample: { type: CurrentType; durationMs: number }) => void;
}

export function CurrentScene({ phase, onSample }: CurrentSceneProps) {
  const [waypoints] = useState<Record<CurrentType, Waypoints>>(() => ({
    poem: generateWaypoints(),
    color: generateWaypoints(),
    shape: generateWaypoints(),
    symbol: generateWaypoints(),
    line: generateWaypoints(),
    circle: generateWaypoints(),
  }));

  const hoverStart = useRef<{ type: CurrentType; t: number } | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const handleHoverStart = (type: CurrentType) => {
    if (phaseRef.current !== "play") return;
    hoverStart.current = { type, t: performance.now() };
  };

  const handleHoverEnd = (type: CurrentType) => {
    const start = hoverStart.current;
    hoverStart.current = null;
    if (!start || phaseRef.current !== "play") return;
    const durationMs = performance.now() - start.t;
    if (durationMs >= MIN_DWELL_MS) {
      onSample({ type, durationMs });
    }
  };

  if (phase === "setup") return null;

  return (
    <>
      {TYPES.map((type) => (
        <Floating
          key={type}
          type={type}
          waypoints={waypoints[type]}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
        >
          {renderContent(type)}
        </Floating>
      ))}
    </>
  );
}
