"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FolderClock,
  Laptop,
  PlugZap,
  Smartphone,
} from "lucide-react";
import { BackupBundle } from "@/lib/backup";
import { DesktopOS, backupLocations } from "@/lib/os";
import { BackupInfo } from "@/types/stats";
import { BackupPicker } from "./BackupPicker";
import { Dropzone } from "./Dropzone";

const APPLE_DEVICES_URL = "https://apps.microsoft.com/detail/9NP83LWLPZ9K";
type ImportRoute = "choose" | "icloud" | "existing" | "new";

function CopyPath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(path).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }).catch(() => {})}
      className="glass-field group flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <code className="min-w-0 flex-1 truncate text-xs text-white/70">{path}</code>
      {copied ? <Check size={15} className="text-[#70e1a1]" /> : <Copy size={15} className="text-white/45" />}
    </button>
  );
}

function Choice({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="glass-choice group text-left"
    >
      <span className="glass-icon">{icon}</span>
      <span className="min-w-0 flex-1">
        <strong className="block text-[15px] font-semibold tracking-[-0.01em]">{title}</strong>
        <span className="mt-1 block text-sm leading-snug text-white/48">{detail}</span>
      </span>
      <ChevronRight size={18} className="text-white/28 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
    </motion.button>
  );
}

function GuideStep({
  number,
  title,
  children,
  visual,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  visual: string;
}) {
  return (
    <div className="grid gap-4 border-t border-white/[.08] py-6 first:border-0 first:pt-2 md:grid-cols-[1fr_240px] md:items-center">
      <div className="flex gap-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#111318]">{number}</span>
        <div>
          <h4 className="font-semibold tracking-[-0.015em]">{title}</h4>
          <div className="mt-1.5 text-sm leading-relaxed text-white/53">{children}</div>
        </div>
      </div>
      <div className="guide-placeholder">
        <Laptop size={24} />
        <span>{visual}</span>
        <small>Screenshot placeholder</small>
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

export function IphoneGuide(props: IphoneGuideProps) {
  const { os, bundle, info, probing, password, passwordError, directFile, onBundle, onSingleFile, onPassword } = props;
  const [route, setRoute] = useState<ImportRoute>(bundle ? "existing" : directFile ? "icloud" : "choose");
  const locations = backupLocations(os);
  const ready = !!bundle || !!directFile;

  const routeTitle = route === "icloud"
    ? "Use Messages already on this Mac"
    : route === "existing"
      ? "Open your existing backup"
      : "Create a fresh iPhone backup";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#a9cfff]">
          <Smartphone size={14} /> iPhone setup
        </div>
        <h2 className="text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
          Bring your messages in.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/52">
          Choose the quickest route for this computer. Files are read locally in
          your browser and disappear when you close the tab.
        </p>
      </header>

      {route === "choose" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {os === "mac" && (
            <Choice
              icon={<Cloud size={20} />}
              title="I use Messages in iCloud"
              detail="Fastest — use the message database already synced to this Mac."
              onClick={() => setRoute("icloud")}
            />
          )}
          <Choice
            icon={<FolderClock size={20} />}
            title={`I already have a backup on ${os === "mac" ? "this Mac" : "this PC"}`}
            detail="Choose an existing Finder, Apple Devices, or iTunes backup."
            onClick={() => setRoute("existing")}
          />
          <Choice
            icon={<PlugZap size={20} />}
            title="I need to make a backup"
            detail={`Follow a visual ${os === "windows" ? "Windows" : "Mac"} walkthrough, then import it.`}
            onClick={() => setRoute("new")}
          />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {route !== "choose" && (
          <motion.div key={route} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <button onClick={() => setRoute("choose")} className="mb-4 text-sm text-white/45 hover:text-white">← Choose another route</button>
            <h3 className="mb-5 text-xl font-semibold tracking-[-0.025em]">{routeTitle}</h3>

            {route === "icloud" ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#76b7ff]/20 bg-[#76b7ff]/[.07] p-4 text-sm leading-relaxed text-white/65">
                  In Finder press <strong className="text-white">⌘ ⇧ G</strong>, open each path below, and drag the file into its matching box.
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">1. Messages database</label>
                  <CopyPath path="~/Library/Messages/chat.db" />
                  <div className="mt-2">
                    <Dropzone onFileSelected={(f) => onSingleFile(f, "messages")} accept=".db" label={directFile?.name || "Drop chat.db here"} hint="Required" icon={<Database size={20} />} hasFile={!!directFile} />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">2. Contacts database <span className="font-normal text-white/38">— optional, adds names and photos</span></label>
                  <CopyPath path="~/Library/Application Support/AddressBook/Sources" />
                  <div className="mt-2">
                    <Dropzone onFileSelected={(f) => onSingleFile(f, "contacts")} accept=".abcddb,.vcf" label="Drop AddressBook-v22.abcddb or a .vcf" hint="Your wrap still works without it" icon={<Database size={20} />} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {route === "new" && (
                  <div className="rounded-[22px] border border-white/[.08] bg-black/15 px-5">
                    {os === "windows" ? (
                      <>
                        <GuideStep number={1} title="Install Apple Devices" visual="Apple Devices · Microsoft Store">
                          Download Apple&apos;s free <a className="text-[#9bcdff] underline" href={APPLE_DEVICES_URL} target="_blank" rel="noreferrer">Apple Devices app <ExternalLink className="inline" size={12} /></a>. Open it after installation.
                        </GuideStep>
                        <GuideStep number={2} title="Connect and trust your iPhone" visual="Trust This Computer prompt">
                          Unlock your iPhone, connect it with a data-capable cable, then tap <strong className="text-white">Trust</strong> on the phone.
                        </GuideStep>
                        <GuideStep number={3} title="Back up to this computer" visual="General · Back Up Now">
                          Select your iPhone, choose <strong className="text-white">General</strong>, then <strong className="text-white">Back Up Now</strong>. Leave encryption as-is; textstat supports both.
                        </GuideStep>
                      </>
                    ) : (
                      <>
                        <GuideStep number={1} title="Connect and trust your iPhone" visual="Finder · iPhone in sidebar">
                          Unlock your iPhone, connect it to your Mac, open Finder, and select the iPhone under <strong className="text-white">Locations</strong>.
                        </GuideStep>
                        <GuideStep number={2} title="Choose a local backup" visual="Back up all data to this Mac">
                          In <strong className="text-white">General</strong>, select “Back up all of the data on your iPhone to this Mac.”
                        </GuideStep>
                        <GuideStep number={3} title="Finish the backup" visual="Back Up Now button">
                          Click <strong className="text-white">Back Up Now</strong> and wait for “Latest Backup” to show the current time.
                        </GuideStep>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-white/38">Backup folder location</p>
                  <div className="space-y-2">{locations.map((item) => <CopyPath key={item.path} path={item.path} />)}</div>
                  <p className="mt-2 text-xs leading-relaxed text-white/38">
                    {os === "mac" ? "In Finder press ⌘ ⇧ G, paste the path, then press Return." : "Paste this into the Folder box in the file picker, then press Enter."}
                  </p>
                </div>

                <BackupPicker bundle={bundle} info={info} probing={probing} password={password} passwordError={passwordError} onBundle={onBundle} onSingleFile={onSingleFile} onPassword={onPassword} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {ready && route === "choose" && <p className="text-sm text-[#70e1a1]">Your message source is ready. Continue below.</p>}
    </div>
  );
}
