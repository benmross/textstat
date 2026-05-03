"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

function CopyPath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };
  return (
    <div className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-[10px] border border-white/15 bg-black/25 p-[0.55rem_0.75rem]">
      <code className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.85rem]">
        {path}
      </code>
      <button
        onClick={handle}
        className={`inline-flex flex-none items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-[0.6rem] py-[0.25rem] font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
          copied ? "bg-[#aef63926] text-[#aef639]" : "text-[#ffd60a] hover:bg-white/20"
        }`}
      >
        {copied ? <><Check size={11} strokeWidth={2.5} />copied!</> : <><Copy size={11} strokeWidth={2} />copy</>}
      </button>
    </div>
  );
}

const kbd = (label: string) => (
  <kbd className="rounded-md border border-white/20 bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.85em]">
    {label}
  </kbd>
);

export function IphoneGuide() {
  const steps = [
    {
      step: 1,
      body: (
        <p>
          Open <strong className="text-[#ffd60a]">Finder</strong> and press{" "}
          {kbd("⌘")} + {kbd("⇧")} + {kbd("G")} to open Go to Folder.
        </p>
      ),
    },
    {
      step: 2,
      body: (
        <>
          <p>Paste this path and press <strong>Go</strong>, then drag <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">chat.db</code> into the <strong className="text-[#ffd60a]">Messages</strong> box below:</p>
          <CopyPath path="~/Library/Messages" />
        </>
      ),
    },
    {
      step: 3,
      body: (
        <>
          <p>Press {kbd("⌘")} + {kbd("⇧")} + {kbd("G")} again, paste this path and press <strong>Go</strong>, then drag the <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">AddressBook</code> folder into the <strong className="text-[#aef639]">Contacts</strong> box below:</p>
          <CopyPath path="~/Library/Application Support" />
        </>
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
