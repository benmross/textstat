"use client";

import { motion } from "framer-motion";
import { Platform } from "@/types/stats";
import { FaApple, FaAndroid } from "react-icons/fa";

interface PlatformPickerProps {
  onSelect: (platform: Platform) => void;
}

export function PlatformPicker({ onSelect }: PlatformPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="mb-6 text-[clamp(3rem,9vw,7.5rem)] font-black leading-[0.95] tracking-[-0.04em]">
        Your year
        <br />
        <span className="bg-gradient-to-r from-[#ff2e63] via-[#ffd60a] to-[#aef639] bg-clip-text text-transparent">
          in messages.
        </span>
      </h1>
      <p className="mb-10 max-w-[620px] text-[clamp(1rem,1.4vw,1.2rem)] leading-[1.45] text-white/80">
        See a Spotify-Wrapped-style story of every text you sent, every contact
        you obsessed over, every emoji you wore out — all 100% private, nothing
        leaves your device.
      </p>

      <h2 className="mb-4 text-[clamp(1.2rem,2.2vw,1.6rem)] font-bold tracking-[-0.01em]">
        First — what kind of phone?
      </h2>

      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <motion.button
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("iphone")}
          className="group relative flex flex-col items-center gap-2 rounded-[28px] border-2 border-white/15 bg-white/5 p-8 pb-6 text-center transition-all hover:border-white/35 hover:bg-white/10 hover:shadow-[0_16px_40px_-14px_rgba(0,0,0,.4)]"
        >
          <FaApple size={56} className="drop-shadow-[0_6px_12px_rgba(0,0,0,.3)] text-white/90" />
          <span className="text-xl font-extrabold tracking-[-0.02em]">
            iPhone
          </span>
          <span className="font-mono text-sm text-white/55">iMessage · chat.db</span>
        </motion.button>

        <motion.button
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("android")}
          className="group relative flex flex-col items-center gap-2 rounded-[28px] border-2 border-white/15 bg-white/5 p-8 pb-6 text-center transition-all hover:border-white/35 hover:bg-white/10 hover:shadow-[0_16px_40px_-14px_rgba(0,0,0,.4)]"
        >
          <FaAndroid size={56} className="drop-shadow-[0_6px_12px_rgba(0,0,0,.3)] text-[#3DDC84]" />
          <span className="text-xl font-extrabold tracking-[-0.02em]">
            Android
          </span>
          <span className="font-mono text-sm text-white/55">
            SMS Backup &amp; Restore
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
