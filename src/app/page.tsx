"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center px-8 py-24 overflow-hidden"
      animate={{
        background: [
          "radial-gradient(ellipse at 50% 50%, #11161f 0%, #0a0e14 70%)",
          "radial-gradient(ellipse at 50% 50%, #0d1320 0%, #080b11 70%)",
          "radial-gradient(ellipse at 50% 50%, #11161f 0%, #0a0e14 70%)",
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <main className="flex flex-col items-center gap-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="font-[family-name:var(--font-eb-garamond)] text-7xl sm:text-8xl tracking-wide text-[#e0dfdb]"
          style={{ fontWeight: 500 }}
        >
          Tide
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.4 }}
          className="text-2xl sm:text-3xl text-[#e0dfdb]/70"
          style={{ letterSpacing: "0.3em" }}
        >
          潮
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
          className="max-w-md text-base sm:text-lg italic text-[#e0dfdb]/60 leading-relaxed mt-4"
        >
          A small experiment in attention as aesthetic experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeInOut", delay: 1.6 }}
          className="mt-12"
        >
          <Link
            href="/games/drift"
            className="group inline-block px-10 py-3 border border-[#e0dfdb]/30 rounded-sm text-[#e0dfdb]/80 text-sm tracking-[0.3em] uppercase transition-all duration-700 ease-in-out hover:border-[#e0dfdb]/60 hover:text-[#e0dfdb] hover:shadow-[0_0_24px_rgba(224,223,219,0.18)] hover:bg-[#e0dfdb]/[0.03]"
          >
            Begin
          </Link>
        </motion.div>
      </main>
    </motion.div>
  );
}
