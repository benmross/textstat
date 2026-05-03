"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-[120px] -right-[120px] h-[520px] w-[520px] rounded-full bg-[#ff2e63] opacity-55 mix-blend-screen blur-[80px]"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-[160px] -left-[160px] h-[520px] w-[520px] rounded-full bg-[#00d6ff] opacity-55 mix-blend-screen blur-[80px]"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />
      <motion.div
        className="absolute top-[30%] left-[40%] h-[280px] w-[280px] rounded-full bg-[#aef639] opacity-55 mix-blend-screen blur-[80px]"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 12,
        }}
      />
    </div>
  );
}
