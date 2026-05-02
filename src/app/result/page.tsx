"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GameData,
  ScoreResult,
  TideType,
  calculateType,
} from "@/lib/scoring";

const TYPE_LABELS: Record<
  TideType,
  { chinese: string; english: string; description: string }
> = {
  tide: {
    chinese: "潮",
    english: "Tide",
    description: "You move in rhythms. Attention flows, recedes, and returns.",
  },
  mountain: {
    chinese: "山",
    english: "Mountain",
    description: "You hold steady. Attention is a form of loyalty.",
  },
  mirror: {
    chinese: "镜",
    english: "Mirror",
    description: "You receive without grasping. Attention is open presence.",
  },
  stream: {
    chinese: "溪",
    english: "Stream",
    description: "You find the path. Attention follows what yields.",
  },
  firefly: {
    chinese: "萤",
    english: "Firefly",
    description: "You pulse. Attention ignites in bursts of vivid focus.",
  },
};

const TYPE_ORDER: TideType[] = [
  "tide",
  "mountain",
  "mirror",
  "stream",
  "firefly",
];

const KEYS = {
  drift: "tide_drift_result",
  periphery: "tide_periphery_result",
  pulse: "tide_pulse_result",
  glimpse: "tide_glimpse_result",
  current: "tide_current_result",
} as const;

type LoadStatus = "loading" | "missing" | "ready";

function readJSON(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadGameData(): GameData | null {
  const drift = readJSON(KEYS.drift) as
    | { meanDistance?: number; distanceVariance?: number }
    | null;
  const periphery = readJSON(KEYS.periphery) as
    | { flashes?: unknown[]; accuracy?: number }
    | null;
  const pulse = readJSON(KEYS.pulse) as
    | { tapCount?: number; meanInterval?: number; intervalVariance?: number }
    | null;
  const glimpse = readJSON(KEYS.glimpse) as
    | { whole?: number; detail?: number; mood?: number; structure?: number }
    | null;
  const current = readJSON(KEYS.current) as
    | {
        totalDwell?: number;
        switches?: number;
        longestDwell?: number;
        preferredType?: string;
      }
    | null;

  if (!drift || !periphery || !pulse || !glimpse || !current) return null;

  return {
    drift: {
      meanDistance: drift.meanDistance ?? 0,
      distanceVariance: drift.distanceVariance ?? 0,
    },
    periphery: {
      count: Array.isArray(periphery.flashes) ? periphery.flashes.length : 0,
      accuracy: periphery.accuracy ?? 0,
    },
    pulse: {
      tapCount: pulse.tapCount ?? 0,
      meanInterval: pulse.meanInterval ?? 0,
      intervalVariance: pulse.intervalVariance ?? 0,
    },
    glimpse: {
      whole: glimpse.whole ?? 0,
      detail: glimpse.detail ?? 0,
      mood: glimpse.mood ?? 0,
      structure: glimpse.structure ?? 0,
    },
    current: {
      totalDwell: current.totalDwell ?? 0,
      switches: current.switches ?? 0,
      longestDwell: current.longestDwell ?? 0,
      preferredType: current.preferredType ?? "",
    },
  };
}

export default function ResultPage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [result, setResult] = useState<ScoreResult | null>(null);

  useEffect(() => {
    const data = loadGameData();
    if (!data) {
      setStatus("missing");
      return;
    }
    setResult(calculateType(data));
    setStatus("ready");
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0e14]" />;
  }

  if (status === "missing") {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="flex flex-col items-center gap-10 text-center max-w-md"
        >
          <p className="text-[#e0dfdb]/60 italic font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed">
            Please play the games first.
          </p>
          <Link
            href="/"
            className="px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03]"
          >
            Begin
          </Link>
        </motion.div>
      </div>
    );
  }

  // status === "ready"
  if (!result) return null;
  const winner = TYPE_LABELS[result.type];

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e0dfdb] flex items-center justify-center px-6 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
        className="w-full max-w-xl flex flex-col gap-20"
      >
        <div className="flex flex-col items-center gap-8 text-center">
          <h1
            className="font-[family-name:var(--font-eb-garamond)] text-5xl sm:text-6xl tracking-wide"
            style={{ fontWeight: 500 }}
          >
            {winner.chinese} · {winner.english}
          </h1>
          <p className="text-base sm:text-lg italic text-[#e0dfdb]/70 leading-relaxed max-w-md">
            {winner.description}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {TYPE_ORDER.map((t) => {
            const label = TYPE_LABELS[t];
            const score = result.scores[t];
            const isWinner = t === result.type;
            return (
              <div key={t} className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline text-xs tracking-[0.25em] uppercase">
                  <span
                    className={
                      isWinner ? "text-[#e0dfdb]" : "text-[#e0dfdb]/40"
                    }
                  >
                    {label.chinese} {label.english}
                  </span>
                  <span
                    className={
                      isWinner ? "text-[#e0dfdb]" : "text-[#e0dfdb]/40"
                    }
                  >
                    {score}
                  </span>
                </div>
                <div className="h-[2px] bg-[#e0dfdb]/10 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                    className={
                      isWinner
                        ? "h-full bg-[#e0dfdb]/90"
                        : "h-full bg-[#e0dfdb]/30"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Link
            href="/meditation"
            className="px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03]"
          >
            Continue
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
