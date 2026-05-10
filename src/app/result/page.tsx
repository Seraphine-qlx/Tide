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
import { detectLanguage, type Language } from "@/lib/language";

interface TypeLabel {
  chinese: string;
  english: string;
  description: { en: string; zh: string };
  poetic: string;
}

const TYPE_LABELS: Record<TideType, TypeLabel> = {
  tide: {
    chinese: "潮",
    english: "Tide",
    description: {
      en: "You move in rhythms. Attention flows, recedes, and returns.",
      zh: "你在节奏里行走。注意力流动，退去，回来。",
    },
    poetic: "流动如潮，有韵自来",
  },
  mountain: {
    chinese: "山",
    english: "Mountain",
    description: {
      en: "You hold steady. Attention is a form of loyalty.",
      zh: "你停下了。注意力是一种忠诚。",
    },
    poetic: "静如山岳，自有重量",
  },
  mirror: {
    chinese: "镜",
    english: "Mirror",
    description: {
      en: "You receive without grasping. Attention is open presence.",
      zh: "你映照，但不抓取。注意力是敞开的在场。",
    },
    poetic: "空明如镜，万象俱收",
  },
  stream: {
    chinese: "溪",
    english: "Stream",
    description: {
      en: "You find the path. Attention follows what yields.",
      zh: "你找到了路径。注意力跟随让出来的方向。",
    },
    poetic: "顺势而行，曲折自通",
  },
  firefly: {
    chinese: "萤",
    english: "Firefly",
    description: {
      en: "You pulse. Attention ignites in bursts of vivid focus.",
      zh: "注意力像脉冲。亮，暗，又亮。",
    },
    poetic: "一点星火，照见当下",
  },
};

const SECTION_LABELS = {
  en: {
    observed: "01  WHAT WE OBSERVED",
    means: "02  WHAT IT MEANS",
    howTo: "03  HOW TO BE WITH IT",
  },
  zh: {
    observed: "01  我们看见了什么",
    means: "02  它意味着什么",
    howTo: "03  如何与之共处",
  },
} as const;

const UI_TEXT = {
  en: {
    header: "YOUR ATTENTION TYPE",
    distribution: "PATTERN DISTRIBUTION",
    continueLabel: "CONTINUE",
    playAgain: "play again",
    missingMessage: "Please play the games first.",
    begin: "Begin",
  },
  zh: {
    header: "你的注意力类型",
    distribution: "类型分布",
    continueLabel: "继续",
    playAgain: "再玩一次",
    missingMessage: "请先玩五个游戏。",
    begin: "开始",
  },
} as const;

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

const SECTION_TEXT = {
  en: {
    observation:
      "Your cursor traced the light with a steady, undulating rhythm — neither tightly locked nor drifting away. Your taps fell at regular intervals. Your gaze returned to the same elements, again and again.",
    science:
      "Tide-type attention follows the brain's natural theta rhythm (Busch et al., 2010, PNAS) — sampling the world in periodic waves rather than constant focus. It is not distraction. It is rhythm.",
    acceptance:
      "You do not need to force sustained focus. Your mind moves in tides — work with the wave, not against it. Rest at the trough. Move at the peak. The pattern is already in you.",
  },
  zh: {
    observation:
      "你的光标以稳定起伏的节奏追随着光——既没有紧紧锁住，也没有飘散开去。你的点击落在规律的间隔上。你的目光一次又一次回到同样的元素。",
    science:
      "潮型注意力跟随大脑天然的 theta 节律（Busch et al., 2010, PNAS）——以周期性的波浪采样世界，而不是恒定聚焦。这不是分心，是节奏。",
    acceptance:
      "你不需要强迫自己持续聚焦。你的心智像潮水一样移动——顺着浪走，而不是逆着它。在波谷处休息，在波峰处行动。那个节奏，本来就在你身上。",
  },
} as const;

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

function SectionLabel({
  children,
  lang = "en",
}: {
  children: React.ReactNode;
  lang?: Language;
}) {
  return (
    <div
      style={{
        fontFamily: lang === "zh" ? HAN : SERIF,
        fontSize: 10,
        letterSpacing: lang === "zh" ? "6px" : "4px",
        opacity: 0.35,
        maxWidth: 640,
        margin: "0 auto",
        textAlign: "center",
        textTransform: lang === "zh" ? "none" : "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function SectionBody({
  children,
  lang = "en",
}: {
  children: React.ReactNode;
  lang?: Language;
}) {
  return (
    <p
      style={{
        fontFamily: lang === "zh" ? HAN : SERIF,
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
  const [language, setLanguage] = useState<Language>("en");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const lang = detectLanguage();
    setLanguage(lang);

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

    fetch("/api/soundscape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: computed.type,
        scores: computed.scores,
        gameData: data,
        language: lang,
      }),
    })
      .then((res) => res.json())
      .then((payload) => {
        try {
          localStorage.setItem(
            `tide_soundscape_prefetch_${lang}`,
            JSON.stringify(payload)
          );
        } catch {
          // ignore — storage best-effort
        }
      })
      .catch(() => {
        // ignore — meditation page falls back to its own fetch
      });
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
              fontFamily: language === "zh" ? HAN : SERIF,
              fontStyle: "italic",
              fontSize: 18,
              opacity: 0.6,
              lineHeight: 1.7,
            }}
          >
            {UI_TEXT[language].missingMessage}
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
            {UI_TEXT[language].begin}
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
            fontFamily: language === "zh" ? HAN : SERIF,
            fontSize: 11,
            letterSpacing: language === "zh" ? "8px" : "6px",
            opacity: 0.4,
            textTransform: "uppercase",
          }}
        >
          {UI_TEXT[language].header}
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
            fontFamily: language === "zh" ? HAN : SERIF,
            fontStyle: "italic",
            fontSize: 15,
            opacity: 0.68,
            marginTop: 8,
          }}
        >
          {winner.description[language]}
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

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].observed}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[language].observation}
        </SectionBody>

        <ThinRule />

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].means}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[language].science}
        </SectionBody>

        <ThinRule />

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].howTo}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[language].acceptance}
        </SectionBody>

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
            fontFamily: language === "zh" ? HAN : SERIF,
            fontSize: 11,
            letterSpacing: language === "zh" ? "8px" : "6px",
            opacity: 0.35,
            marginTop: 48,
            textTransform: language === "zh" ? "none" : "uppercase",
          }}
        >
          {UI_TEXT[language].distribution}
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
              fontFamily: language === "zh" ? HAN : SERIF,
              fontSize: 13,
              letterSpacing: language === "zh" ? "8px" : "5px",
              padding: "14px 48px",
              border: `0.6px solid rgba(26,26,26,0.5)`,
              color: INK,
              textTransform: language === "zh" ? "none" : "uppercase",
              transition: "background-color 600ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(26,26,26,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {UI_TEXT[language].continueLabel}
          </Link>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePlayAgain}
            style={{
              fontFamily: language === "zh" ? HAN : SERIF,
              fontSize: 11,
              letterSpacing: language === "zh" ? "4px" : "3px",
              opacity: 0.3,
              marginTop: 20,
              marginBottom: 60,
              background: "none",
              border: "none",
              color: INK,
              cursor: "pointer",
              textTransform: language === "zh" ? "none" : "lowercase",
            }}
          >
            {UI_TEXT[language].playAgain}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
