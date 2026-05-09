"use client";

import { useState } from "react";

const PAPER = "#f5f1e8";
const INK = "#1a1a1a";
const SERIF = "var(--font-eb-garamond)";
const HAN = "var(--font-noto-serif-sc)";

const TYPES = [
  { key: "tide", chinese: "潮", english: "Tide" },
  { key: "mountain", chinese: "山", english: "Mountain" },
  { key: "mirror", chinese: "镜", english: "Mirror" },
  { key: "stream", chinese: "溪", english: "Stream" },
  { key: "firefly", chinese: "萤", english: "Firefly" },
] as const;

type TypeKey = (typeof TYPES)[number]["key"];

export default function CalligraphyPreviewPage() {
  const [errored, setErrored] = useState<Record<TypeKey, boolean>>({
    tide: false,
    mountain: false,
    mirror: false,
    stream: false,
    firefly: false,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAPER,
        color: INK,
        padding: "48px 24px",
        fontFamily: SERIF,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 64,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
        className="calligraphy-grid"
      >
        {TYPES.map((t) => (
          <div
            key={t.key}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 240,
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {errored[t.key] ? (
                <div
                  style={{
                    width: 240,
                    height: 240,
                    border: `1px solid rgba(26,26,26,0.3)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: HAN,
                    fontSize: 48,
                    color: INK,
                    opacity: 0.5,
                  }}
                >
                  {t.chinese}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/calligraphy/${t.key}.png`}
                  alt={t.chinese}
                  style={{
                    width: 240,
                    height: 240,
                    objectFit: "contain",
                  }}
                  onError={() =>
                    setErrored((prev) => ({ ...prev, [t.key]: true }))
                  }
                />
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                opacity: 0.4,
              }}
            >
              <div
                style={{
                  fontFamily: HAN,
                  fontSize: 14,
                  letterSpacing: "2px",
                  color: INK,
                }}
              >
                {t.chinese}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 11,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: INK,
                  marginTop: 4,
                }}
              >
                {t.english}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .calligraphy-grid {
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}
