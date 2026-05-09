"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PAPER = "#f5f1e8";
const INK = "#1a1a1a";
const SERIF = "var(--font-eb-garamond)";

const KEYS = {
  drift: "tide_drift_result",
  periphery: "tide_periphery_result",
  pulse: "tide_pulse_result",
  glimpse: "tide_glimpse_result",
  current: "tide_current_result",
} as const;

type DriftData = { meanDistance?: number; distanceVariance?: number };
type PeripheryData = { flashes?: unknown[]; accuracy?: number };
type PulseData = {
  tapCount?: number;
  meanInterval?: number;
  intervalVariance?: number;
};
type CurrentData = {
  totalDwell?: number;
  switches?: number;
  longestDwell?: number;
};

type Loaded = {
  drift: DriftData | null;
  periphery: PeripheryData | null;
  pulse: PulseData | null;
  current: CurrentData | null;
};

type Status = "loading" | "empty" | "ready";

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function AboutPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<Loaded | null>(null);
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    setIsChinese(navigator.language.toLowerCase().includes("zh"));

    const loaded: Loaded = {
      drift: readJSON<DriftData>(KEYS.drift),
      periphery: readJSON<PeripheryData>(KEYS.periphery),
      pulse: readJSON<PulseData>(KEYS.pulse),
      current: readJSON<CurrentData>(KEYS.current),
    };

    const anyPresent =
      loaded.drift !== null ||
      loaded.periphery !== null ||
      loaded.pulse !== null ||
      loaded.current !== null;

    if (!anyPresent) {
      setStatus("empty");
      return;
    }

    setData(loaded);
    setStatus("ready");
  }, []);

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", backgroundColor: PAPER }} />;
  }

  if (status === "empty") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: PAPER,
          color: INK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 16,
            opacity: 0.7,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {isChinese
            ? "你还没有玩过 Tide。"
            : "You haven't played Tide yet."}
        </p>
        <Link
          href="/"
          style={{
            fontFamily: SERIF,
            fontSize: 11,
            letterSpacing: "3px",
            opacity: 0.4,
            color: INK,
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          {isChinese ? "开始" : "Begin"}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const lines: React.ReactNode[] = [];

  if (data.drift && typeof data.drift.distanceVariance === "number") {
    const v = Math.round(data.drift.distanceVariance);
    lines.push(
      isChinese
        ? `你的目光跟随了潮水 ${v} 毫秒的起伏`
        : `Your gaze followed the tide through ${v} ms of variation.`
    );
  }

  if (data.pulse && typeof data.pulse.tapCount === "number") {
    lines.push(
      isChinese
        ? `你点击了 ${data.pulse.tapCount} 次`
        : `You tapped ${data.pulse.tapCount} times.`
    );
  }

  if (data.current && typeof data.current.switches === "number") {
    lines.push(
      isChinese
        ? `你在 ${data.current.switches} 次注意力转移之间切换`
        : `You shifted between elements ${data.current.switches} times.`
    );
  }

  if (data.current && typeof data.current.longestDwell === "number") {
    const seconds = (data.current.longestDwell / 1000).toFixed(1);
    lines.push(
      isChinese
        ? `你最长一次停留了 ${seconds} 秒`
        : `Your longest pause lasted ${seconds} seconds.`
    );
  }

  if (data.periphery && typeof data.periphery.accuracy === "number") {
    const acc = data.periphery.accuracy.toFixed(2);
    lines.push(
      isChinese
        ? `你以 ${acc} 的精度感知了边缘`
        : `You sensed the edges with ${acc} precision.`
    );
  }

  const closing = isChinese
    ? ["这些数字是你今天的影子", "明天会不一样"]
    : [
        "These numbers are your shadow today.",
        "Tomorrow they will be different.",
      ];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: PAPER,
        color: INK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "20vh",
        paddingBottom: "20vh",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 16,
          lineHeight: 2.4,
          maxWidth: 480,
          textAlign: "center",
          color: INK,
        }}
      >
        <div>
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          {closing.map((line, i) => (
            <span key={i}>
              {line}
              {i < closing.length - 1 && <br />}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 32, opacity: 0.7 }}>
          — Tide, May 2026
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 11,
          opacity: 0.3,
          letterSpacing: "1px",
          color: INK,
        }}
      >
        Lixuan Qu · github.com/Seraphine-qlx/Tide
      </div>
    </div>
  );
}
