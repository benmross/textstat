"use client";

import { motion } from "framer-motion";
import { Upload, User, Sparkles } from "lucide-react";
import { BackupInfo, Platform } from "@/types/stats";
import { BackupBundle } from "@/lib/backup";
import { DesktopOS } from "@/lib/os";
import { IphoneGuide } from "./IphoneGuide";
import { AndroidGuide } from "./AndroidGuide";
import { Dropzone } from "./Dropzone";
import { FileChip } from "./FileChip";
import { fmtFileSize } from "@/lib/formatting";

interface PlatformGuideProps {
  platform: Platform;
  os: DesktopOS;
  onBack: () => void;
  dbFile: File | null;
  contactsFile: File | null;
  backup: BackupBundle | null;
  backupInfo: BackupInfo | null;
  probing: boolean;
  password: string;
  passwordError: string | null;
  onDbFile: (f: File) => void;
  onContactsFile: (f: File) => void;
  onBundle: (b: BackupBundle) => void;
  onSingleFile: (f: File, kind: "messages" | "contacts") => void;
  onPassword: (p: string) => void;
  onRemoveDb: () => void;
  onRemoveContacts: () => void;
  onStart: () => void;
}

export function PlatformGuide({
  platform,
  os,
  onBack,
  dbFile,
  contactsFile,
  backup,
  backupInfo,
  probing,
  password,
  passwordError,
  onDbFile,
  onContactsFile,
  onBundle,
  onSingleFile,
  onPassword,
  onRemoveDb,
  onRemoveContacts,
  onStart,
}: PlatformGuideProps) {
  const isIphone = platform === "iphone";
  const needsPassword = !!backupInfo?.encrypted && !password;
  const canStart = isIphone
    ? (!!backup && !needsPassword && !probing) || !!dbFile
    : !!dbFile;

  let buttonLabel = "Drop your files above to continue";
  if (canStart) buttonLabel = "";
  else if (isIphone && needsPassword) buttonLabel = "Enter your backup password above";
  else if (isIphone && probing) buttonLabel = "Reading your backup…";
  else if (isIphone) buttonLabel = "Choose your backup folder above";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={onBack}
        className="mb-1 inline-flex items-center gap-[0.35rem] text-sm font-semibold text-white/65 transition-opacity hover:opacity-100"
      >
        ← Choose a different phone
      </button>

      {isIphone ? (
        <IphoneGuide
          os={os}
          bundle={backup}
          info={backupInfo}
          probing={probing}
          password={password}
          passwordError={passwordError}
          directFile={dbFile}
          onBundle={onBundle}
          onSingleFile={onSingleFile}
          onPassword={onPassword}
        />
      ) : (
        <AndroidGuide />
      )}

      {!isIphone && (
        <div className="mt-6 flex flex-col gap-3">
          <div>
            <h3 className="mb-2 text-[1.05rem] font-bold tracking-[-0.01em]">
              Messages <span className="text-[#ff2e63] font-extrabold">*</span>
            </h3>
            <Dropzone
              onFileSelected={onDbFile}
              accept=".xml,application/xml,text/xml"
              label="Click or drag your .xml backup here"
              hint="sms-*.xml from SMS Backup & Restore"
              icon={<Upload size={22} />}
              iconBg="linear-gradient(135deg, #ff2e63, #ffd60a)"
              iconShadow="rgba(255,46,99,.45)"
              hasFile={!!dbFile}
            />
          </div>

          <div>
            <h3 className="mb-2 text-[1.05rem] font-bold tracking-[-0.01em]">
              Contacts
              <span className="text-[0.8rem] font-normal text-white/50">
                {" "}(optional — names &amp; photos in your wrap)
              </span>
            </h3>
            <Dropzone
              onFileSelected={onContactsFile}
              accept=".vcf,text/vcard"
              label="Contacts (.vcf)"
              hint="exported from your contacts app"
              icon={<User size={22} />}
              iconBg="linear-gradient(135deg, #00d6ff, #aef639)"
              iconShadow="rgba(0,214,255,.45)"
              hasFile={!!contactsFile}
            />
          </div>
        </div>
      )}

      <motion.button
        whileHover={canStart ? { y: -2 } : undefined}
        whileTap={canStart ? { y: 0 } : undefined}
        onClick={onStart}
        disabled={!canStart}
        className={`mt-4 w-full rounded-[18px] px-6 py-4 text-[1.1rem] font-extrabold tracking-[-0.01em] transition-all ${
          canStart
            ? "cursor-pointer bg-gradient-to-br from-[#ff2e63] via-[#6c25c4] to-[#00d6ff] text-white shadow-[0_12px_40px_-8px_rgba(255,46,99,.45),0_0_0_1px_rgba(255,255,255,.15)] hover:shadow-[0_16px_48px_-6px_rgba(255,46,99,.55),0_0_0_1px_rgba(255,255,255,.2)]"
            : "cursor-not-allowed bg-white/[0.06] text-white/35"
        }`}
      >
        {canStart ? (
          <span className="inline-flex items-center gap-2">
            Generate My Wrap <Sparkles size={18} />
          </span>
        ) : (
          buttonLabel
        )}
      </motion.button>

      {(!isIphone || dbFile || contactsFile) && (
        <div className="my-3 flex min-h-[2.5rem] flex-wrap items-center gap-2">
          {dbFile && (
            <FileChip
              fileName={dbFile.name}
              fileSize={fmtFileSize(dbFile.size)}
              onRemove={onRemoveDb}
            />
          )}
          {contactsFile && (
            <FileChip
              fileName={contactsFile.name}
              fileSize={fmtFileSize(contactsFile.size)}
              onRemove={onRemoveContacts}
            />
          )}
        </div>
      )}

      <div className="mt-6 flex gap-6 text-[0.9rem] text-white/70 max-md:flex-wrap">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#aef639] shadow-[0_0_14px_#aef639]" />
          100% client-side
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#aef639] shadow-[0_0_14px_#aef639]" />
          Streams 10GB+ files
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#aef639] shadow-[0_0_14px_#aef639]" />
          Nothing leaves your device
        </span>
      </div>
    </motion.div>
  );
}
