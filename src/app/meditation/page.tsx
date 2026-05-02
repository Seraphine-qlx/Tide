"use client";

import { motion } from "framer-motion";

export default function MeditationPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-6">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0.25, 0.45] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-[#e0dfdb] italic font-[family-name:var(--font-eb-garamond)] text-2xl tracking-[0.4em]"
      >
        breathe
      </motion.p>
    </div>
  );
}
