"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { BackupBundle } from "@/lib/backup";
import { DesktopOS, backupLocations } from "@/lib/os";
import { BackupInfo } from "@/types/stats";
import { BackupPicker } from "./BackupPicker";

// Apple's official iPhone management app for Windows, free on the Store.
const APPLE_DEVICES_URL = "https://apps.microsoft.com/detail/9NP83LWLPZ9K";

function CopyPath({ path, label }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard
          .writeText(path)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          })
          .catch(() => {});
      }}
      className="group flex w-full items-center gap-2 overflow-hidden rounded-[10px] border border-white/15 bg-black/25 px-3 py-2 text-left transition-colors hover:border-white/30"
    >
      <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.8rem] text-white/85">
        {path}
      </code>
      {label && (
        <span className="flex-none text-[0.7rem] uppercase tracking-wider text-white/40">
          {label}
        </span>
      )}
      <span
        className={`inline-flex flex-none items-center gap-1 rounded-lg border border-white/15 px-2 py-[0.15rem] font-mono text-[0.7rem] font-semibold transition-colors ${
          copied ? "bg-[#aef63926] text-[#aef639]" : "bg-white/10 text-[#ffd60a]"
        }`}
      >
        {copied ? (
          <>
            <Check size={10} strokeWidth={3} />
            copied
          </>
        ) : (
          <>
            <Copy size={10} strokeWidth={2} />
            copy
          </>
        )}
      </span>
    </button>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] text-[0.8rem] font-extrabold text-white">
        {n}
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-[0.15rem] text-[0.92rem] leading-[1.5] text-white/85">
        {children}
      </div>
    </div>
  );
}

interface IphoneGuideProps {
  os: DesktopOS;
  bundle: BackupBundle | null;
  info: BackupInfo | null;
  probing: boolean;
  password: string;
  passwordError: string | null;
  directFile: File | null;
  onBundle: (b: BackupBundle) => void;
  onSingleFile: (f: File, kind: "messages" | "contacts") => void;
  onPassword: (p: string) => void;
}

export function IphoneGuide({
  os,
  bundle,
  info,
  probing,
  password,
  passwordError,
  directFile,
  onBundle,
  onSingleFile,
  onPassword,
}: IphoneGuideProps) {
  const ready = !!bundle || !!directFile;
  // Once we've found a backup the setup steps are done, so they fold away on
  // their own. Derived rather than stored, so no effect has to chase `ready` —
  // an explicit click just overrides it from then on.
  const [stepsOverride, setStepsOverride] = useState<boolean | null>(null);
  const showSteps = stepsOverride ?? !ready;

  const backupApp = os === "windows" ? "the Apple Devices app" : "Finder";
  const locations = backupLocations(os);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="text-[clamp(1.2rem,2.2vw,1.6rem)] font-bold tracking-[-0.01em]">
          Point us at your iPhone backup
        </h2>
        <p className="mt-1 text-[0.92rem] text-white/60">
          Everything is read in your browser. Your messages never leave this
          {os === "other" ? " device" : " computer"}.
        </p>
      </div>

      <BackupPicker
        bundle={bundle}
        info={info}
        probing={probing}
        password={password}
        passwordError={passwordError}
        onBundle={onBundle}
        onSingleFile={onSingleFile}
        onPassword={onPassword}
      />

      {!bundle && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] uppercase tracking-wider text-white/40">
            Your backups live here
          </span>
          {locations.map((loc) => (
            <CopyPath
              key={loc.path}
              path={loc.path}
              label={locations.length > 1 ? loc.label : undefined}
            />
          ))}
          <span className="text-[0.78rem] leading-snug text-white/45">
            {os === "windows"
              ? "Paste into the Folder box of the file picker and press Enter."
              : "In the file picker press ⌘ + ⇧ + G, paste, then press Go."}
          </span>
        </div>
      )}

      {/* Setup steps — collapsed automatically once a backup shows up. */}
      <div className="rounded-[18px] border border-white/12 bg-white/[0.03]">
        <button
          onClick={() => setStepsOverride(!showSteps)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="inline-flex items-center gap-2 text-[0.92rem] font-semibold">
            {ready ? (
              <>
                <Check size={16} className="text-[#aef639]" strokeWidth={3} />
                <span className="text-white/70">Backup ready</span>
              </>
            ) : (
              <span>No backup yet? Make one — about 2 minutes of setup</span>
            )}
          </span>
          <ChevronDown
            size={17}
            className={`flex-none text-white/50 transition-transform ${showSteps ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showSteps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 px-4 pb-4">
                {os === "windows" && (
                  <Step n={1}>
                    <p>
                      Install Apple&apos;s free{" "}
                      <strong className="text-[#ffd60a]">Apple Devices</strong> app —
                      Windows needs it to talk to an iPhone.
                    </p>
                    <a
                      href={APPLE_DEVICES_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-br from-[#ff2e63] to-[#6c25c4] px-4 py-2 text-[0.9rem] font-bold text-white transition-transform hover:-translate-y-[1px]"
                    >
                      Get Apple Devices <ExternalLink size={14} />
                    </a>
                    <span className="text-[0.82rem] text-white/50">
                      Already installed? Skip to step 2.
                    </span>
                  </Step>
                )}

                <Step n={os === "windows" ? 2 : 1}>
                  <p>
                    <strong>Unlock your iPhone</strong>, plug it into this computer,
                    and tap <strong className="text-[#ffd60a]">Trust</strong> when it
                    asks.
                  </p>
                  <span className="text-[0.82rem] text-white/50">
                    If nothing happens, the cable may be charge-only — try another.
                  </span>
                </Step>

                <Step n={os === "windows" ? 3 : 2}>
                  <p>
                    In <strong className="text-[#ffd60a]">{backupApp}</strong>, click
                    your iPhone in the sidebar, then click{" "}
                    <strong>Back Up Now</strong>. Leave the encryption checkbox
                    exactly as it is — we handle either way.
                  </p>
                  <span className="text-[0.82rem] text-white/50">
                    When it finishes, drop the folder above.
                  </span>
                </Step>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {os === "mac" && !ready && (
        <p className="text-[0.82rem] leading-snug text-white/45">
          Already have Messages set up on this Mac? You can drag{" "}
          <code className="rounded bg-white/10 px-1 py-[1px] font-mono">
            ~/Library/Messages/chat.db
          </code>{" "}
          in instead — though it only covers what iCloud has synced down, and
          won&apos;t include contact names.
        </p>
      )}
    </motion.div>
  );
}
