"use client";

import { motion } from "framer-motion";
import { Platform } from "@/types/stats";
import { ArrowDown, ShieldCheck, Sparkles } from "lucide-react";

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
      <div className="mx-auto max-w-4xl text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3.5 py-2 text-xs font-medium text-white/70 backdrop-blur-xl">
        <Sparkles size={14} className="text-[#b9d8ff]" />
        Your conversations, beautifully remembered
      </div>
      <h1 className="text-[clamp(3.4rem,9vw,7.8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
        Your life,
        <br />
        <span className="apple-gradient-text">in messages.</span>
      </h1>
      <p className="mx-auto mt-8 max-w-[660px] text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.55] text-white/58">
        Turn years of iMessages into a cinematic, personal story. Everything is
        processed on this device. Nothing is uploaded, stored, or seen by us.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a href="#import" className="primary-button">
          Create my story <ArrowDown size={17} />
        </a>
        <span className="inline-flex items-center gap-1.5 text-sm text-white/45">
          <ShieldCheck size={15} /> works with encrypted backups
        </span>
      </div>
      <button onClick={() => {
        onSelect("android");
        window.setTimeout(() => document.querySelector("#import")?.scrollIntoView({ behavior: "smooth" }), 0);
      }} className="mt-6 text-sm text-white/42 transition-colors hover:text-white/75">
        Using Android? <span className="underline underline-offset-4">Start here instead</span>
      </button>
      </div>
    </motion.div>
  );
}
