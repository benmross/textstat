"use client";

import { motion } from "framer-motion";
import { Upload, User, Sparkles } from "lucide-react";
import { Platform } from "@/types/stats";
import { IphoneGuide } from "./IphoneGuide";
import { AndroidGuide } from "./AndroidGuide";
import { Dropzone } from "./Dropzone";
import { FileChip } from "./FileChip";
import { fmtFileSize } from "@/lib/formatting";

interface PlatformGuideProps {
  platform: Platform;
  onBack: () => void;
  dbFile: File | null;
  contactsFile: File | null;
  onDbFile: (f: File) => void;
  onContactsFile: (f: File) => void;
  onRemoveDb: () => void;
  onRemoveContacts: () => void;
  onStart: () => void;
}

export function PlatformGuide({
  platform,
  onBack,
  dbFile,
  contactsFile,
  onDbFile,
  onContactsFile,
  onRemoveDb,
  onRemoveContacts,
  onStart,
}: PlatformGuideProps) {
  const isIphone = platform === "iphone";
  const canStart = isIphone ? !!(dbFile && contactsFile) : !!dbFile;

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

      {isIphone ? <IphoneGuide /> : <AndroidGuide />}

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <h3 className="mb-2 text-[1.05rem] font-bold tracking-[-0.01em]">
            Messages <span className="text-[#ff2e63] font-extrabold">*</span>
          </h3>
          <Dropzone
            onFileSelected={onDbFile}
            accept={isIphone ? ".db,application/x-sqlite3,application/octet-stream" : ".xml,application/xml,text/xml"}
            label={isIphone ? "chat.db" : "Click or drag your .xml backup here"}
            hint={isIphone ? "~/Library/Messages/chat.db" : "sms-*.xml from SMS Backup & Restore"}
            icon={<Upload size={22} />}
            iconBg="linear-gradient(135deg, #ff2e63, #ffd60a)"
            iconShadow="rgba(255,46,99,.45)"
            hasFile={!!dbFile}
          />
        </div>

        <div>
          <h3 className="mb-2 text-[1.05rem] font-bold tracking-[-0.01em]">
            Contacts{isIphone && <span className="text-[#ff2e63] font-extrabold"> *</span>}
            {!isIphone && (
              <span className="text-[0.8rem] font-normal text-white/50">
                {" "}(optional — names &amp; photos in your wrap)
              </span>
            )}
          </h3>
          <Dropzone
            onFileSelected={onContactsFile}
            accept=".vcf,.abcddb,text/vcard,application/octet-stream"
            label={isIphone ? "AddressBook folder or .abcddb" : "Contacts (.vcf)"}
            hint={isIphone ? "~/Library/Application Support/AddressBook" : "exported from your contacts app"}
            icon={<User size={22} />}
            iconBg="linear-gradient(135deg, #00d6ff, #aef639)"
            iconShadow="rgba(0,214,255,.45)"
            hasFile={!!contactsFile}
            folderPick={isIphone ? (files) => {
              const abs = files.filter(f => f.name.endsWith(".abcddb"));
              return abs.sort((a, b) => b.size - a.size)[0] ?? null;
            } : undefined}
          />
        </div>
      </div>

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
        ) : isIphone && dbFile ? (
          "Add your contacts above to continue"
        ) : (
          "Drop your files above to continue"
        )}
      </motion.button>

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
