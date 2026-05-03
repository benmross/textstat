"use client";

import { motion } from "framer-motion";

const kbd = (label: string) => (
  <kbd className="rounded-md border border-white/20 bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.85em]">
    {label}
  </kbd>
);

export function IphoneGuide() {
  const steps = [
    {
      step: 1,
      body: <p>Open <strong className="text-[#ffd60a]">Finder</strong> on your Mac.</p>,
    },
    {
      step: 2,
      body: (
        <p>
          Press {kbd("⌘")} + {kbd("⇧")} + {kbd("H")} to go to your home folder.
        </p>
      ),
    },
    {
      step: 3,
      body: (
        <p>
          Press {kbd("⌘")} + {kbd("⇧")} + {kbd(".")} to reveal hidden folders.
          A <strong className="text-[#ffd60a]">Library</strong> folder will appear.
        </p>
      ),
    },
    {
      step: 4,
      body: (
        <p>
          Drag the <strong className="text-[#ffd60a]">Library</strong> folder into
          the drop zone below. Your messages and contacts will both be found
          automatically.
        </p>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="mb-4 text-[clamp(1.2rem,2.2vw,1.6rem)] font-bold tracking-[-0.01em]">
        You&apos;ll need your Mac for this
      </h2>
      <div className="flex flex-col gap-4">
        {steps.map((s) => (
          <div key={s.step} className="flex gap-4 max-md:gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
              {s.step}
            </div>
            <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
