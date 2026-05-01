"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PeripheryResult,
  nextRoute,
  storageKey,
} from "@/lib/game-template";

const SHAPE_OPTIONS = ["★", "○", "△", "◇", "☆", "□"] as const;
const COUNT_OPTIONS = [0, 1, 2, 3, 4] as const;

export default function PeripheryQuiz() {
  const router = useRouter();
  const [record, setRecord] = useState<PeripheryResult | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [shapes, setShapes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey("periphery"));
      if (raw) setRecord(JSON.parse(raw) as PeripheryResult);
    } catch {
      // ignore
    }
  }, []);

  const toggleShape = (s: string) => {
    setShapes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = () => {
    if (count === null || submitting) return;
    setSubmitting(true);

    const flashes = record?.flashes ?? [];
    const trueShapes = new Set(flashes.map((f) => f.shape));
    const trueCount = flashes.length;

    const countCorrect = count === trueCount ? 1 : 0;

    let shapeScore = 0;
    SHAPE_OPTIONS.forEach((s) => {
      const userPicked = shapes.includes(s);
      const actuallyAppeared = trueShapes.has(s as (typeof SHAPE_OPTIONS)[number] & ("★" | "○" | "△" | "◇"));
      if (userPicked === actuallyAppeared) shapeScore++;
    });
    const shapeAccuracy = shapeScore / SHAPE_OPTIONS.length;
    const accuracy = (countCorrect + shapeAccuracy) / 2;

    const updated: PeripheryResult = {
      flashes,
      answers: { count, shapes },
      accuracy,
    };

    try {
      localStorage.setItem(storageKey("periphery"), JSON.stringify(updated));
    } catch {
      // ignore
    }

    router.push(nextRoute("pulse"));
  };

  const optionBase =
    "border rounded-sm transition-all duration-500 ease-in-out";
  const optionIdle =
    "border-[#e0dfdb]/20 text-[#e0dfdb]/60 hover:border-[#e0dfdb]/50 hover:text-[#e0dfdb]/90";
  const optionActive =
    "border-[#e0dfdb]/70 text-[#e0dfdb] bg-[#e0dfdb]/[0.06]";

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e0dfdb] flex items-center justify-center px-8 py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="w-full max-w-xl flex flex-col gap-24"
      >
        <h1
          className="font-[family-name:var(--font-eb-garamond)] text-3xl sm:text-4xl tracking-wide text-center"
          style={{ fontWeight: 500 }}
        >
          A few questions
        </h1>

        <div className="flex flex-col gap-10">
          <p className="text-base sm:text-lg text-[#e0dfdb]/80 italic text-center">
            How many symbols did you see?
          </p>
          <div className="flex justify-center gap-6 sm:gap-8">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`${optionBase} w-14 h-14 sm:w-16 sm:h-16 text-lg tracking-wide ${
                  count === n ? optionActive : optionIdle
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <p className="text-base sm:text-lg text-[#e0dfdb]/80 italic text-center">
            Which shapes appeared?
          </p>
          <div className="grid grid-cols-3 gap-x-10 gap-y-8 sm:gap-x-14 sm:gap-y-10 justify-items-center">
            {SHAPE_OPTIONS.map((s) => {
              const selected = shapes.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleShape(s)}
                  className={`${optionBase} w-20 h-20 text-4xl ${
                    selected ? optionActive : optionIdle
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={handleSubmit}
            disabled={count === null || submitting}
            className="px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#e0dfdb]/30 disabled:hover:text-[#e0dfdb]/80 disabled:hover:shadow-none disabled:hover:bg-transparent"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
