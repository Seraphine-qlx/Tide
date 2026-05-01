"use client";

import { motion } from "framer-motion";

export default function ResultPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-6">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="text-[#e0dfdb] italic font-[family-name:var(--font-eb-garamond)] text-2xl tracking-[0.4em]"
      >
        . . .
      </motion.p>
    </div>
  );
}
