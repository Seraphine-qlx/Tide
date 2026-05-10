"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const BG = "#0a0e14";
const FG = "#e0dfdb";
const SERIF_EN = "var(--font-eb-garamond)";
const SERIF_ZH = "var(--font-noto-serif-sc)";

type TrailPoint = { x: number; y: number; t: number };

type DriftData = { distanceVariance?: number };
type PeripheryData = { accuracy?: number };
type PulseData = { tapCount?: number };

interface Loaded {
  trail: TrailPoint[] | null;
  drift: DriftData | null;
  pulse: PulseData | null;
  pulseTimestamps: number[] | null;
  periphery: PeripheryData | null;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface Bbox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

function computeBbox(points: TrailPoint[], pad = 24): Bbox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, width: 1, height: 1 };
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: width + pad * 2,
    height: height + pad * 2,
  };
}

function CursorTrailLayer({ points }: { points: TrailPoint[] }) {
  const bbox = useMemo(() => computeBbox(points), [points]);
  const polyline = useMemo(
    () => points.map((p) => `${p.x},${p.y}`).join(" "),
    [points],
  );

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: "8%",
        left: "10%",
        right: "10%",
        height: "60%",
      }}
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 0.4, x: [0, 15, -15, 0] }}
      transition={{
        opacity: { duration: 2, delay: 0.5, ease: "easeInOut" },
        x: { duration: 30, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <svg
        viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <polyline
          points={polyline}
          stroke={FG}
          strokeWidth={1.2}
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

function PulseRhythmLayer({ timestamps }: { timestamps: number[] }) {
  const filtered = useMemo(
    () => timestamps.filter((t) => t >= 0 && t <= 30000),
    [timestamps],
  );

  return (
    <motion.div
      className="absolute pointer-events-none inset-0"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 0.3, y: [0, 8, -8, 0] }}
      transition={{
        opacity: { duration: 2, delay: 5, ease: "easeInOut" },
        y: { duration: 25, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {filtered.map((t, i) => {
          const x = 200 + (t / 30000) * 600;
          const y = 300;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2.5}
              fill={FG}
              opacity={0.55}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function PeripheryGlowLayer({ accuracy }: { accuracy: number }) {
  const target = Math.min(accuracy + 0.15, 0.4);
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: target }}
      transition={{ duration: 2, delay: 10, ease: "easeInOut" }}
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(224, 223, 219, 0.18) 0%, transparent 28%),
          radial-gradient(circle at 100% 0%, rgba(224, 223, 219, 0.18) 0%, transparent 28%),
          radial-gradient(circle at 0% 100%, rgba(224, 223, 219, 0.18) 0%, transparent 28%),
          radial-gradient(circle at 100% 100%, rgba(224, 223, 219, 0.18) 0%, transparent 28%)
        `,
      }}
    />
  );
}

interface DataLineProps {
  text: string;
  delay: number;
  fontFamily: string;
}

function DataLine({ text, delay, fontFamily }: DataLineProps) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ duration: 1.5, delay, ease: "easeInOut" }}
      style={{
        fontFamily,
        fontStyle: "italic",
        fontSize: 16,
        color: FG,
        textAlign: "center",
        maxWidth: 480,
        margin: 0,
      }}
    >
      {text}
    </motion.p>
  );
}

export default function AboutPage() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    setIsChinese(navigator.language.toLowerCase().startsWith("zh"));
    setLoaded({
      trail: readJSON<TrailPoint[]>("tide_drift_trail"),
      drift: readJSON<DriftData>("tide_drift_result"),
      pulse: readJSON<PulseData>("tide_pulse_result"),
      pulseTimestamps: readJSON<number[]>("tide_pulse_timestamps"),
      periphery: readJSON<PeripheryData>("tide_periphery_result"),
    });
  }, []);

  if (!loaded) {
    return (
      <div
        style={{ minHeight: "100vh", background: BG }}
        suppressHydrationWarning
      />
    );
  }

  const fontFamily = isChinese ? SERIF_ZH : SERIF_EN;

  const variance =
    typeof loaded.drift?.distanceVariance === "number"
      ? Math.round(loaded.drift.distanceVariance)
      : null;
  const tapCount =
    typeof loaded.pulse?.tapCount === "number" ? loaded.pulse.tapCount : null;
  const accuracy =
    typeof loaded.periphery?.accuracy === "number"
      ? loaded.periphery.accuracy
      : null;

  const hasAnyData =
    variance !== null ||
    tapCount !== null ||
    accuracy !== null ||
    (loaded.trail && loaded.trail.length > 0) ||
    (loaded.pulseTimestamps && loaded.pulseTimestamps.length > 0);

  if (!hasAnyData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          color: FG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SERIF_EN,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          style={{ fontStyle: "italic", fontSize: 14 }}
        >
          — Tide, May 2026
        </motion.div>
      </div>
    );
  }

  const driftLine =
    variance !== null
      ? isChinese
        ? `你的目光跟随了潮水 ${variance} 毫秒的起伏`
        : `Your gaze followed the tide through ${variance} ms of variation.`
      : null;

  const pulseLine =
    tapCount !== null
      ? isChinese
        ? `你点击了 ${tapCount} 次`
        : `You tapped ${tapCount} times.`
      : null;

  const peripheryLine =
    accuracy !== null
      ? isChinese
        ? `你以 ${accuracy.toFixed(2)} 的精度感知了边缘`
        : `You sensed the edges with ${accuracy.toFixed(2)} precision.`
      : null;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: BG,
        color: FG,
        overflow: "hidden",
      }}
    >
      {loaded.trail && loaded.trail.length > 1 && (
        <CursorTrailLayer points={loaded.trail} />
      )}

      {loaded.pulseTimestamps && loaded.pulseTimestamps.length > 0 && (
        <PulseRhythmLayer timestamps={loaded.pulseTimestamps} />
      )}

      {accuracy !== null && <PeripheryGlowLayer accuracy={accuracy} />}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "18%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          padding: "0 24px",
        }}
      >
        {driftLine && (
          <DataLine text={driftLine} delay={1} fontFamily={fontFamily} />
        )}
        {pulseLine && (
          <DataLine text={pulseLine} delay={5.5} fontFamily={fontFamily} />
        )}
        {peripheryLine && (
          <DataLine
            text={peripheryLine}
            delay={10.5}
            fontFamily={fontFamily}
          />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.5, delay: 18, ease: "easeInOut" }}
        style={{
          position: "fixed",
          bottom: "3rem",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SERIF_EN,
          fontStyle: "italic",
          fontSize: 14,
          color: FG,
        }}
      >
        — Tide, May 2026
      </motion.div>
    </div>
  );
}
