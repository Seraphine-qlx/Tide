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
}

const TYPE_LABELS: Record<TideType, TypeLabel> = {
  tide: {
    chinese: "潮",
    english: "Tide",
    description: {
      en: "You move in rhythms. Attention flows, recedes, and returns.",
      zh: "你在节奏里行走。注意力流动，退去，回来。",
    },
  },
  mountain: {
    chinese: "山",
    english: "Mountain",
    description: {
      en: "You hold steady. Attention is a form of loyalty.",
      zh: "你停下了。注意力是一种忠诚。",
    },
  },
  mirror: {
    chinese: "镜",
    english: "Mirror",
    description: {
      en: "You receive without grasping. Attention is open presence.",
      zh: "你映照，但不抓取。注意力是敞开的在场。",
    },
  },
  stream: {
    chinese: "溪",
    english: "Stream",
    description: {
      en: "You find the path. Attention follows what yields.",
      zh: "你找到了路径。注意力跟随让出来的方向。",
    },
  },
  firefly: {
    chinese: "萤",
    english: "Firefly",
    description: {
      en: "You pulse. Attention ignites in bursts of vivid focus.",
      zh: "注意力像脉冲。亮，暗，又亮。",
    },
  },
};

const SECTION_LABELS = {
  en: {
    observed: "01  WHAT WE OBSERVED",
    is: "02  WHAT THIS IS",
    where: "03  WHERE IT SHOWS UP",
  },
  zh: {
    observed: "01  我们观察到",
    is: "02  这是什么",
    where: "03  它在哪里发生",
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

type SectionBodies = {
  observed: { en: string; zh: string };
  is: { en: string; zh: string };
  where: { en: string; zh: string };
};

const SECTION_TEXT: Record<TideType, SectionBodies> = {
  tide: {
    observed: {
      en: "Your cursor followed the light in steady rhythmic variation — neither holding too tight nor drifting too far. Your clicks fell in regular intervals. Your gaze returned to the same elements again and again.",
      zh: "你的光标以稳定的节奏起伏地追随光，既没有锁死，也没有走散。你的点击落在规律的间隔上。你的目光一次次回到同样的元素。",
    },
    is: {
      en: "Attention that moves in waves. Engagement and recovery alternate naturally. Rather than locking onto one focus, your attention samples, returns, samples again.",
      zh: "一种波动的注意力。专注和恢复自然交替。你的注意力不会锁死在一个焦点，它会去看一眼，回来，再去。",
    },
    where: {
      en: "Writing, editing, design — work with natural rhythm and revision suits this attention. Long stretches of vigilance work or constant context-switching tend to feel draining.",
      zh: "写作、剪辑、设计——有自然节奏和修改空间的工作适合这种注意力。需要长时间持续警觉、或不断快速切换情境的工作会让你感到消耗。",
    },
  },
  mountain: {
    observed: {
      en: "Your cursor stayed close to the light with low variance. You changed focus rarely in the final game. Once you settled on something, you stayed there.",
      zh: "你的光标贴近光，方差很小。在最后的游戏里你切换得很少。一旦你停在某个地方，你就停在那里。",
    },
    is: {
      en: "Attention that holds. Once engaged, it sustains without much drift. New stimuli don't pull it easily.",
      zh: "一种锁定的注意力。一旦投入，不容易飘开。新的刺激很难把它拉走。",
    },
    where: {
      en: "Deep reading, programming, research, craft — long-form work that rewards sustained focus is where this attention is at home. Quick task-switching environments and constant interruption tend to feel like fighting against the grain.",
      zh: "深度阅读、编程、研究、手工——奖励长时间专注的长形态工作是它的领域。需要不停切换任务、持续被打断的环境会让你感到吃力。",
    },
  },
  mirror: {
    observed: {
      en: "You caught what appeared at the edges. In the final game, your attention spread evenly across all the floating elements. Your cursor neither chased the light tightly nor lost it.",
      zh: "你捕捉到了出现在边缘的东西。在最后的游戏里，你的注意力均匀分布在所有漂浮的元素上。你的光标既没有紧追光，也没有失去它。",
    },
    is: {
      en: "Attention spread evenly across the field. Awareness of surroundings without locking on any single thing. A wide, open monitoring.",
      zh: "一种均匀分布在整个视野的注意力。对周围有觉知，但不锁定任何单一事物。一种开放的监听。",
    },
    where: {
      en: "Teaching, hosting, group conversations, observing complex systems — situations that reward holding many things at once suit this attention. Tasks that demand intense single-point focus over long periods tend to ask more effort.",
      zh: "教学、主持、群体对话、观察复杂系统——奖励同时关照多件事的场景适合它。需要长时间高强度单点专注的任务会让你需要更多努力。",
    },
  },
  stream: {
    observed: {
      en: "When the image flashed, you tended to perceive its structure. Your cursor adapted to the light's path with moderate variation. In the final game, your attention moved between elements following what attracted it.",
      zh: "闪现的画面里，你倾向于感知到它的结构。你的光标以适度的起伏跟随光的路径。在最后的游戏里，你的注意力跟着被吸引的元素移动。",
    },
    is: {
      en: "Attention that follows what yields. It moves around obstacles rather than through them. It finds the path of least resistance.",
      zh: "一种跟随让出来的方向的注意力。它绕开阻力而不是顶着阻力走。它找的是最容易走的那条路。",
    },
    where: {
      en: "Improvisation, teaching that adapts to the room, freelance work that shifts between projects, creative problem-solving — situations that reward responsiveness and adaptation suit this attention. Strictly procedural tasks with fixed order tend to feel constraining.",
      zh: "即兴、根据场域调整的教学、在不同项目之间切换的自由职业、创造性的问题解决——奖励灵活和适应的场景适合它。严格按程序、固定顺序的任务会让你感到束缚。",
    },
  },
  firefly: {
    observed: {
      en: "Your cursor's distance from the light varied widely — close, then far, then close again. The intervals between your clicks were uneven. In the final game, you switched between elements many times, with short dwells.",
      zh: "你的光标和光之间的距离起伏很大——一会儿近，一会儿远，又一会儿近。你点击的间隔不均匀。在最后的游戏里，你在元素之间切换了很多次，每次停留都很短。",
    },
    is: {
      en: "Attention that pulses. Sharp and bright when engaged, then drops away to refresh. Periods of intense focus alternate with periods of drift.",
      zh: "一种脉冲式的注意力。投入时清晰明亮，然后退去恢复。强烈专注的时段和飘散的时段交替出现。",
    },
    where: {
      en: "Bursts of creative work, brainstorming, sprint-style tasks, intense periods followed by rest — work that moves with energy waves suits this attention. Sustained low-stimulus work tends to deplete energy quickly.",
      zh: "突发的创造性工作、头脑风暴、冲刺型任务、强度高的时段后休息——和能量波动同步的工作适合它。持续的低刺激工作会让你的能量很快被消耗。",
    },
  },
};

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

        <ThinRule />

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].observed}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[result.type].observed[language]}
        </SectionBody>

        <ThinRule />

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].is}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[result.type].is[language]}
        </SectionBody>

        <ThinRule />

        <SectionLabel lang={language}>
          {SECTION_LABELS[language].where}
        </SectionLabel>
        <SectionBody lang={language}>
          {SECTION_TEXT[result.type].where[language]}
        </SectionBody>

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
