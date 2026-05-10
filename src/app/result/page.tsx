"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GameData,
  ScoreResult,
  TideType,
  calculateType,
} from "@/lib/scoring";
import { renderPortrait } from "@/lib/portrait";

const TYPE_LABELS: Record<
  TideType,
  {
    chinese: string;
    english: string;
    description: string;
    poetic: string;
  }
> = {
  tide: {
    chinese: "潮",
    english: "Tide",
    description: "You move in rhythms. Attention flows, recedes, and returns.",
    poetic: "流动如潮，有韵自来",
  },
  mountain: {
    chinese: "山",
    english: "Mountain",
    description: "You hold steady. Attention is a form of loyalty.",
    poetic: "静如山岳，自有重量",
  },
  mirror: {
    chinese: "镜",
    english: "Mirror",
    description: "You receive without grasping. Attention is open presence.",
    poetic: "空明如镜，万象俱收",
  },
  stream: {
    chinese: "溪",
    english: "Stream",
    description: "You find the path. Attention follows what yields.",
    poetic: "顺势而行，曲折自通",
  },
  firefly: {
    chinese: "萤",
    english: "Firefly",
    description: "You pulse. Attention ignites in bursts of vivid focus.",
    poetic: "一点星火，照见当下",
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

const OBSERVATION_TEXT =
  "Your cursor traced the light with a steady, undulating rhythm — neither tightly locked nor drifting away. Your taps fell at regular intervals. Your gaze returned to the same elements, again and again.";

const SCIENCE_TEXT =
  "Tide-type attention follows the brain's natural theta rhythm (Busch et al., 2010, PNAS) — sampling the world in periodic waves rather than constant focus. It is not distraction. It is rhythm.";

const ACCEPTANCE_TEXT =
  "You do not need to force sustained focus. Your mind moves in tides — work with the wave, not against it. Rest at the trough. Move at the peak. The pattern is already in you.";

type LoadStatus = "loading" | "missing" | "ready";

const INK = "#1a1a1a";
const PAPER = "#f5f1e8";
const SEAL_RED = "#8b2818";

const SERIF = "var(--font-eb-garamond)";
const HAN = "var(--font-noto-serif-sc)";

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
  console.log("[tide] raw localStorage values:", {
    drift: localStorage.getItem(KEYS.drift),
    periphery: localStorage.getItem(KEYS.periphery),
    pulse: localStorage.getItem(KEYS.pulse),
    glimpse: localStorage.getItem(KEYS.glimpse),
    current: localStorage.getItem(KEYS.current),
  });

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

function ThinRule() {
  return (
    <div
      style={{
        width: 200,
        margin: "48px auto",
        borderTop: `1px solid ${INK}`,
        opacity: 0.1,
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: 10,
        letterSpacing: "4px",
        opacity: 0.35,
        maxWidth: 640,
        margin: "0 auto",
        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SERIF,
        fontSize: 14,
        opacity: 0.75,
        maxWidth: 640,
        margin: "16px auto 0",
        textAlign: "center",
        lineHeight: 1.9,
      }}
    >
      {children}
    </p>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const data = loadGameData();
    if (!data) {
      setStatus("missing");
      return;
    }
    const computed = calculateType(data);
    setGameData(data);
    setResult(computed);
    setStatus("ready");
    try {
      localStorage.setItem(
        "tide_result",
        JSON.stringify({ type: computed.type, scores: computed.scores })
      );
    } catch {
      // ignore — storage best-effort
    }
  }, []);

  useEffect(() => {
    if (!result || !gameData || !canvasRef.current) return;
    renderPortrait(result.type, gameData, canvasRef.current);
  }, [result, gameData]);

  const handlePlayAgain = () => {
    try {
      for (const key of Object.values(KEYS)) {
        localStorage.removeItem(key);
      }
      localStorage.removeItem("tide_result");
    } catch {
      // ignore — clearing is best-effort
    }
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: PAPER }} />
    );
  }

  if (status === "missing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: PAPER,
          color: INK,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            textAlign: "center",
            maxWidth: 420,
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 18,
              opacity: 0.6,
              lineHeight: 1.7,
            }}
          >
            Please play the games first.
          </p>
          <Link
            href="/"
            style={{
              fontFamily: SERIF,
              fontSize: 13,
              letterSpacing: "5px",
              padding: "14px 48px",
              border: `0.6px solid rgba(26,26,26,0.5)`,
              color: INK,
              textTransform: "uppercase",
            }}
          >
            Begin
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!result) return null;
  const winner = TYPE_LABELS[result.type];
  const winnerScore = result.scores[result.type];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: PAPER,
        color: INK,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      >
        <div
          style={{
            paddingTop: 60,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 11,
            letterSpacing: "6px",
            opacity: 0.4,
            textTransform: "uppercase",
          }}
        >
          YOUR ATTENTION TYPE
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "40px 0",
          }}
        >
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{ width: 240, height: 240, display: "block" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                fontFamily: HAN,
                fontSize: 96,
                lineHeight: 1,
                color: INK,
                opacity: 0.88,
              }}
            >
              {winner.chinese}
            </span>
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: -30,
                transform: "translateY(-50%)",
                width: 22,
                height: 22,
                backgroundColor: SEAL_RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: HAN,
                  fontSize: 11,
                  color: PAPER,
                  lineHeight: 1,
                }}
              >
                印
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 20,
            letterSpacing: "6px",
            opacity: 0.7,
            marginTop: 12,
            textTransform: "uppercase",
          }}
        >
          {winner.english}
        </div>

        <p
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 15,
            opacity: 0.68,
            marginTop: 8,
          }}
        >
          {winner.description}
        </p>

        <div
          style={{
            textAlign: "center",
            fontFamily: HAN,
            fontSize: 12,
            letterSpacing: "3px",
            opacity: 0.4,
            marginTop: 8,
          }}
        >
          {winner.poetic}
        </div>

        <ThinRule />

        <SectionLabel>01&nbsp;&nbsp;WHAT WE OBSERVED</SectionLabel>
        <SectionBody>{OBSERVATION_TEXT}</SectionBody>

        <ThinRule />

        <SectionLabel>02&nbsp;&nbsp;WHAT IT MEANS</SectionLabel>
        <SectionBody>{SCIENCE_TEXT}</SectionBody>

        <ThinRule />

        <SectionLabel>03&nbsp;&nbsp;HOW TO BE WITH IT</SectionLabel>
        <SectionBody>{ACCEPTANCE_TEXT}</SectionBody>

        <div
          style={{
            textAlign: "center",
            fontFamily: HAN,
            fontSize: 13,
            letterSpacing: "4px",
            opacity: 0.35,
            marginTop: 48,
          }}
        >
          {winner.poetic}
        </div>

        <ThinRule />

        <div
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 11,
            letterSpacing: "6px",
            opacity: 0.35,
            marginTop: 48,
            textTransform: "uppercase",
          }}
        >
          PATTERN DISTRIBUTION
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 32,
            marginTop: 32,
          }}
        >
          {TYPE_ORDER.map((t) => {
            const label = TYPE_LABELS[t];
            const score = result.scores[t];
            const isWinner = t === result.type;
            const radius =
              winnerScore > 0
                ? Math.max(4, (score / winnerScore) * 20)
                : 4;
            const dotOpacity = isWinner ? 0.85 : 0.45 + 0.15 * (score / 100);
            return (
              <div
                key={t}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: "50%",
                      backgroundColor: INK,
                      opacity: dotOpacity,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: HAN,
                    fontSize: 13,
                    opacity: isWinner ? 0.7 : 0.45,
                  }}
                >
                  {label.chinese}
                </span>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 10,
                    letterSpacing: "2px",
                    opacity: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {label.english}
                </span>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 13,
                    opacity: isWinner ? 0.85 : 0.5,
                  }}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        <ThinRule />

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link
            href="/meditation"
            style={{
              fontFamily: SERIF,
              fontSize: 13,
              letterSpacing: "5px",
              padding: "14px 48px",
              border: `0.6px solid rgba(26,26,26,0.5)`,
              color: INK,
              textTransform: "uppercase",
              transition: "background-color 600ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(26,26,26,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            CONTINUE
          </Link>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePlayAgain}
            style={{
              fontFamily: SERIF,
              fontSize: 11,
              letterSpacing: "3px",
              opacity: 0.3,
              marginTop: 20,
              marginBottom: 60,
              background: "none",
              border: "none",
              color: INK,
              cursor: "pointer",
              textTransform: "lowercase",
            }}
          >
            play again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
