"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Upload, User } from "lucide-react";
import { Dropzone } from "./Dropzone";

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

interface IphoneGuideProps {
  dbFile: File | null;
  contactsFile: File | null;
  onDbFile: (f: File) => void;
  onContactsFile: (f: File) => void;
}

export function IphoneGuide({
  dbFile,
  contactsFile,
  onDbFile,
  onContactsFile,
}: IphoneGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      <h2 className="mb-0 text-[clamp(1.2rem,2.2vw,1.6rem)] font-bold tracking-[-0.01em]">
        You&apos;ll need your Mac for this
      </h2>

      {/* Step 1 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          1
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>
            Open <strong className="text-[#ffd60a]">Finder</strong> and press{" "}
            {kbd("⌘ Command")} + {kbd("⇧ Shift")} + {kbd("G")} to open Go to Folder.
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          2
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>Paste this path and press <strong>Go</strong>, then drag <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">chat.db</code>:</p>
          <CopyPath path="~/Library/Messages" />
          <div className="mt-[0.15rem]">
            <Dropzone
              onFileSelected={onDbFile}
              accept=".db,application/x-sqlite3,application/octet-stream"
              label="chat.db"
              hint="~/Library/Messages/chat.db"
              icon={<Upload size={22} />}
              iconBg="linear-gradient(135deg, #ff2e63, #ffd60a)"
              iconShadow="rgba(255,46,99,.45)"
              hasFile={!!dbFile}
            />
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          3
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>
            Open the <strong className="text-[#aef639]">Contacts</strong> app.
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          4
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>
            Select all contacts ({kbd("⌘ Command")} + {kbd("A")}).
          </p>
        </div>
      </div>

      {/* Step 5 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          5
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>
            Go to <strong>File → Export → Export vCard</strong> and save the file.
          </p>
        </div>
      </div>

      {/* Step 6 */}
      <div className="flex gap-4 max-md:gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.95rem] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(255,46,99,.5)]">
          6
        </div>
        <div className="flex flex-1 flex-col gap-[0.45rem] text-[0.95rem] leading-[1.45] text-white/90 max-md:text-sm">
          <p>
            Drag the{" "}
            <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">.vcf</code> here:
          </p>
          <div className="mt-[0.15rem]">
            <Dropzone
              onFileSelected={onContactsFile}
              accept=".vcf,text/vcard"
              label="vCard export (.vcf)"
              hint="File → Export → Export vCard from Contacts app"
              icon={<User size={22} />}
              iconBg="linear-gradient(135deg, #00d6ff, #aef639)"
              iconShadow="rgba(0,214,255,.45)"
              hasFile={!!contactsFile}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
