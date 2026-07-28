"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, FolderOpen, Loader2, Lock, Smartphone, TriangleAlert } from "lucide-react";
import {
  BackupBundle,
  BackupScanResult,
  classifyFile,
  pickBackupFolder,
  scanDroppedEntry,
  scanFileList,
} from "@/lib/backup";
import { supportsDirectoryPicker } from "@/lib/os";
import { BackupInfo } from "@/types/stats";

interface BackupPickerProps {
  bundle: BackupBundle | null;
  info: BackupInfo | null;
  probing: boolean;
  password: string;
  passwordError: string | null;
  onBundle: (b: BackupBundle) => void;
  onSingleFile: (f: File, kind: "messages" | "contacts") => void;
  onPassword: (p: string) => void;
}

function fmtDate(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function BackupPicker({
  bundle,
  info,
  probing,
  password,
  passwordError,
  onBundle,
  onSingleFile,
  onPassword,
}: BackupPickerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // React has no typed prop for directory inputs, so set the attributes directly.
  useEffect(() => {
    const el = folderInputRef.current;
    if (!el) return;
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (info?.encrypted) passwordRef.current?.focus();
  }, [info?.encrypted]);

  const applyResult = useCallback(
    (res: BackupScanResult) => {
      if (res.ok) {
        setError(null);
        onBundle(res.bundle);
      } else if (res.reason === "no-messages") {
        setError(
          "Found a backup, but no messages inside it. If the backup is very old, make a fresh one and try again."
        );
      } else {
        setError(
          "No iPhone backup in that folder. Pick the Backup folder itself — the paths below take you straight there."
        );
      }
    },
    [onBundle]
  );

  const handleChooseFolder = useCallback(async () => {
    setError(null);
    if (supportsDirectoryPicker()) {
      setScanning(true);
      try {
        const res = await pickBackupFolder();
        if (res) applyResult(res);
      } finally {
        setScanning(false);
      }
      return;
    }
    folderInputRef.current?.click();
  }, [applyResult]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      setError(null);

      const item = e.dataTransfer.items?.[0];
      const entry = item?.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        setScanning(true);
        try {
          applyResult(
            await scanDroppedEntry(entry as unknown as Parameters<typeof scanDroppedEntry>[0])
          );
        } finally {
          setScanning(false);
        }
        return;
      }

      // Someone dragged a bare chat.db / .xml / .vcf instead — take it anyway.
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const kind = await classifyFile(file);
      if (kind === "unknown") {
        setError("That file isn't an iPhone backup, a chat.db or a .vcf.");
        return;
      }
      onSingleFile(file, kind);
    },
    [applyResult, onSingleFile]
  );

  const busy = scanning || probing;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;
          setScanning(true);
          try {
            applyResult(scanFileList(files));
          } finally {
            setScanning(false);
          }
        }}
      />

      <motion.div
        whileHover={{ y: -2 }}
        onClick={handleChooseFolder}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-[28px] border-2 p-6 transition-all ${
          bundle
            ? "border-solid border-[#aef639] bg-[#aef6390f]"
            : dragging
              ? "border-dashed border-[#aef639] bg-[#aef63914]"
              : "border-dashed border-white/25 bg-white/[0.03] hover:border-[#aef639] hover:bg-[#aef63914]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl text-[#0d0114]"
            style={{
              background: bundle
                ? "linear-gradient(135deg, #aef639, #00d6ff)"
                : "linear-gradient(135deg, #ff2e63, #ffd60a)",
              boxShadow: "0 8px 24px -6px rgba(255,46,99,.45)",
            }}
          >
            {busy ? (
              <Loader2 size={24} className="animate-spin" />
            ) : bundle ? (
              <Check size={26} strokeWidth={3} />
            ) : (
              <FolderOpen size={24} />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            {busy ? (
              <strong className="text-[1rem] font-bold">
                {probing ? "Reading your backup…" : "Looking for your backup…"}
              </strong>
            ) : bundle && info ? (
              <>
                <strong className="inline-flex items-center gap-2 text-[1rem] font-bold text-[#aef639]">
                  <Smartphone size={16} />
                  {info.deviceName || "iPhone backup"}
                </strong>
                <span className="text-[0.85rem] text-white/65">
                  Backed up {fmtDate(info.date)}
                  {info.productVersion ? ` · iOS ${info.productVersion}` : ""}
                  {bundle.addressBook ? " · contacts found" : ""}
                </span>
              </>
            ) : bundle ? (
              <strong className="text-[1rem] font-bold text-[#aef639]">Backup selected</strong>
            ) : (
              <>
                <strong className="text-[1rem] font-bold">
                  Drop your iPhone backup folder here
                </strong>
                <span className="text-[0.85rem] text-white/60">
                  or click to browse · nothing is uploaded
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-start gap-2 text-[0.85rem] leading-snug text-[#ffd60a]"
        >
          <TriangleAlert size={15} className="mt-[2px] flex-none" />
          {error}
        </motion.p>
      )}

      {info?.encrypted && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 rounded-[18px] border border-white/15 bg-black/25 p-4"
        >
          <label className="inline-flex items-center gap-2 text-[0.9rem] font-semibold">
            <Lock size={15} className="text-[#ffd60a]" />
            This backup is encrypted — enter its password
          </label>
          <input
            ref={passwordRef}
            type="password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            placeholder="Backup password"
            className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-[0.95rem] outline-none transition-colors focus:border-[#aef639]"
          />
          <span className="text-[0.78rem] leading-snug text-white/55">
            The password you set when you first encrypted backups — not your Apple
            Account password. It never leaves this page.
          </span>
          {passwordError && (
            <span className="text-[0.82rem] font-semibold text-[#ff2e63]">
              {passwordError}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
