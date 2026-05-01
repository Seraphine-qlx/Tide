"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GamePhase, GlimpseChoice } from "@/lib/game-template";

const FLASH_MS = 800;
const TOTAL_IMAGES = 3;

function Painting1() {
  return (
    <svg viewBox="0 0 400 400" width="320" height="320">
      <rect width="400" height="400" fill="#1f2c3a" />
      <line x1="40" y1="80" x2="360" y2="84" stroke="#5a728e" strokeWidth="2" opacity="0.55" />
      <line x1="80" y1="160" x2="320" y2="166" stroke="#7c92ad" strokeWidth="2" opacity="0.5" />
      <line x1="40" y1="280" x2="360" y2="285" stroke="#9bb0c8" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="350" x2="300" y2="352" stroke="#5a728e" strokeWidth="1.5" opacity="0.4" />
      <circle cx="200" cy="220" r="80" fill="#5a728e" opacity="0.7" />
      <circle cx="100" cy="120" r="35" fill="#7c92ad" opacity="0.6" />
      <circle cx="310" cy="320" r="45" fill="#9bb0c8" opacity="0.55" />
      <circle cx="60" cy="320" r="20" fill="#7c92ad" opacity="0.45" />
    </svg>
  );
}

function Painting2() {
  return (
    <svg viewBox="0 0 400 400" width="320" height="320">
      <rect width="400" height="400" fill="#2a1f17" />
      <polygon points="80,310 200,80 320,310" fill="#a05c3a" opacity="0.7" />
      <polygon points="60,200 130,90 200,200" fill="#c08055" opacity="0.55" />
      <polygon points="280,210 350,140 320,270" fill="#7e4528" opacity="0.7" />
      <polygon points="100,340 240,310 280,365 180,385 80,360" fill="#b06d3a" opacity="0.5" />
      <polygon points="225,180 270,225 230,260 195,235" fill="#8a4a26" opacity="0.6" />
    </svg>
  );
}

function Painting3() {
  return (
    <svg viewBox="0 0 400 400" width="320" height="320">
      <rect width="400" height="400" fill="#15201a" />
      <g stroke="#7ba089" fill="none" strokeWidth="1.8" opacity="0.65">
        <circle cx="200" cy="200" r="20" />
        <circle cx="203" cy="197" r="42" />
        <circle cx="207" cy="194" r="65" />
        <circle cx="212" cy="191" r="88" />
        <circle cx="218" cy="187" r="112" />
        <circle cx="225" cy="184" r="138" />
      </g>
      <g fill="#a8d4b8">
        <circle cx="80" cy="80" r="3" opacity="0.85" />
        <circle cx="320" cy="120" r="2" opacity="0.8" />
        <circle cx="60" cy="340" r="3" opacity="0.7" />
        <circle cx="350" cy="320" r="2.5" opacity="0.85" />
        <circle cx="170" cy="60" r="2" opacity="0.6" />
        <circle cx="40" cy="200" r="2.5" opacity="0.75" />
        <circle cx="370" cy="220" r="2" opacity="0.7" />
        <circle cx="240" cy="370" r="3" opacity="0.85" />
        <circle cx="100" cy="60" r="2" opacity="0.5" />
        <circle cx="320" cy="50" r="2" opacity="0.6" />
      </g>
    </svg>
  );
}

function Painting({ index }: { index: number }) {
  if (index === 0) return <Painting1 />;
  if (index === 1) return <Painting2 />;
  return <Painting3 />;
}

function WholeIcon() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36">
      <circle cx="20" cy="20" r="14" stroke="#e0dfdb" fill="none" strokeWidth="1.4" />
    </svg>
  );
}

function DetailIcon() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36">
      <circle cx="16" cy="16" r="9" stroke="#e0dfdb" fill="none" strokeWidth="1.4" />
      <line
        x1="23"
        y1="23"
        x2="32"
        y2="32"
        stroke="#e0dfdb"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoodIcon() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36">
      <rect x="6" y="6" width="11" height="11" fill="#e0dfdb" opacity="0.7" />
      <rect x="20" y="6" width="11" height="11" fill="#e0dfdb" opacity="0.4" />
      <rect x="6" y="20" width="11" height="11" fill="#e0dfdb" opacity="0.5" />
      <rect x="20" y="20" width="11" height="11" fill="#e0dfdb" opacity="0.85" />
    </svg>
  );
}

function StructureIcon() {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36">
      <line x1="10" y1="10" x2="20" y2="22" stroke="#e0dfdb" strokeWidth="1.2" />
      <line x1="30" y1="10" x2="20" y2="22" stroke="#e0dfdb" strokeWidth="1.2" />
      <line x1="20" y1="22" x2="10" y2="32" stroke="#e0dfdb" strokeWidth="1.2" />
      <line x1="20" y1="22" x2="30" y2="32" stroke="#e0dfdb" strokeWidth="1.2" />
      <g fill="#e0dfdb">
        <circle cx="10" cy="10" r="2" />
        <circle cx="30" cy="10" r="2" />
        <circle cx="20" cy="22" r="2" />
        <circle cx="10" cy="32" r="2" />
        <circle cx="30" cy="32" r="2" />
      </g>
    </svg>
  );
}

function OptionCard({
  letter,
  label,
  icon,
  onClick,
}: {
  letter: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 p-5 sm:p-6 border border-[#e0dfdb]/20 rounded-sm transition-all duration-500 ease-in-out hover:border-[#e0dfdb]/60 hover:bg-[#e0dfdb]/[0.04] hover:shadow-[0_0_24px_rgba(224,223,219,0.12)] cursor-pointer focus:outline-none"
    >
      <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-500">
        {icon}
      </div>
      <div className="text-xs text-[#e0dfdb]/60 tracking-[0.3em]">{letter}</div>
      <div className="text-sm text-[#e0dfdb]/85 italic">{label}</div>
    </button>
  );
}

interface GlimpseSceneProps {
  phase: GamePhase;
  onChoice: (c: GlimpseChoice) => void;
  onComplete: () => void;
}

export function GlimpseScene({
  phase,
  onChoice,
  onComplete,
}: GlimpseSceneProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [mode, setMode] = useState<"image" | "options">("image");

  useEffect(() => {
    if (phase !== "play") return;
    setImageIndex(0);
    setMode("image");
  }, [phase]);

  useEffect(() => {
    if (phase !== "play" || mode !== "image") return;
    const t = setTimeout(() => setMode("options"), FLASH_MS);
    return () => clearTimeout(t);
  }, [phase, mode, imageIndex]);

  if (phase === "setup") return null;

  const handlePick = (c: GlimpseChoice) => {
    if (mode !== "options") return;
    onChoice(c);
    if (imageIndex < TOTAL_IMAGES - 1) {
      setImageIndex((i) => i + 1);
      setMode("image");
    } else {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {mode === "image" ? (
          <motion.div
            key={`img-${imageIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Painting index={imageIndex} />
          </motion.div>
        ) : (
          <motion.div
            key={`opt-${imageIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center gap-12 px-6 max-w-3xl"
          >
            <p className="text-base sm:text-lg text-[#e0dfdb]/60 italic text-center">
              What did you see most?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 w-full">
              <OptionCard
                letter="A"
                label="The whole shape"
                icon={<WholeIcon />}
                onClick={() => handlePick("whole")}
              />
              <OptionCard
                letter="B"
                label="A detail"
                icon={<DetailIcon />}
                onClick={() => handlePick("detail")}
              />
              <OptionCard
                letter="C"
                label="The mood"
                icon={<MoodIcon />}
                onClick={() => handlePick("mood")}
              />
              <OptionCard
                letter="D"
                label="The structure"
                icon={<StructureIcon />}
                onClick={() => handlePick("structure")}
              />
            </div>
            <p className="text-xs text-[#e0dfdb]/30 tracking-[0.3em]">
              {imageIndex + 1} / {TOTAL_IMAGES}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
