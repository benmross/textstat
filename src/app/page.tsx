"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BackupInfo, Platform, TextStatStats, Screen } from "@/types/stats";
import { BackupBundle } from "@/lib/backup";
import { useDesktopOS } from "@/lib/os";
import { AnimatedBackground } from "@/components/shared/AnimatedBackground";
import { PlatformPicker } from "@/components/landing/PlatformPicker";
import { PlatformGuide } from "@/components/landing/PlatformGuide";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { Slideshow } from "@/components/story/Slideshow";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const os = useDesktopOS();
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [backup, setBackup] = useState<BackupBundle | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [probing, setProbing] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("opening file…");
  const [stats, setStats] = useState<TextStatStats | null>(null);

  const workerRef = useRef<Worker | null>(null);

  const handlePlatformSelect = useCallback((p: Platform) => {
    setPlatform(p);
  }, []);

  const handleBack = useCallback(() => {
    setPlatform(null);
    setDbFile(null);
    setContactsFile(null);
    setBackup(null);
    setBackupInfo(null);
    setPassword("");
    setPasswordError(null);
  }, []);

  // Read Manifest.plist in a short-lived worker so we can name the device and
  // ask for a password before committing to the full parse.
  const handleBundle = useCallback((b: BackupBundle) => {
    setBackup(b);
    setBackupInfo(null);
    setPassword("");
    setPasswordError(null);
    setDbFile(null);
    setContactsFile(null);
    setProbing(true);

    const probe = new Worker("/worker.js");
    probe.onmessage = (e) => {
      if (e.data?.type === "probed") {
        setBackupInfo(
          e.data.info ?? { encrypted: false, deviceName: "", productVersion: "", date: 0 }
        );
        setProbing(false);
        probe.terminate();
      }
    };
    probe.onerror = () => {
      setBackupInfo({ encrypted: false, deviceName: "", productVersion: "", date: 0 });
      setProbing(false);
      probe.terminate();
    };
    probe.postMessage({ type: "probe", backup: b });
  }, []);

  const handleSingleFile = useCallback(
    (file: File, kind: "messages" | "contacts") => {
      setBackup(null);
      setBackupInfo(null);
      if (kind === "contacts") setContactsFile(file);
      else setDbFile(file);
    },
    []
  );

  const classifyDB = useCallback(async (file: File): Promise<boolean> => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xml") || name.endsWith(".db") || name === "chat.db")
      return true;
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (head[0] === 0x53 && head[1] === 0x51 && head[2] === 0x4c) return true;
    if (head[0] === 0x3c && head[1] === 0x3f && head[2] === 0x78) return true;
    return false;
  }, []);

  const classifyContacts = useCallback(async (file: File): Promise<boolean> => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".vcf") || file.type === "text/vcard") return true;
    if (name.endsWith(".abcddb")) return true;
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const txt = new TextDecoder().decode(head);
    if (txt.startsWith("BEGIN:VCARD")) return true;
    return false;
  }, []);

  const handleDbFile = useCallback(
    async (file: File) => {
      const ok = await classifyDB(file);
      if (!ok) {
        alert(
          "Hmm — that doesn't look like an SMS backup XML or chat.db. Try another file?"
        );
        return;
      }
      setDbFile(file);
    },
    [classifyDB]
  );

  const handleContactsFile = useCallback(
    async (file: File) => {
      const ok = await classifyContacts(file);
      if (!ok) {
        alert(
          "That doesn't look like a vCard contacts file (.vcf). Try another?"
        );
        return;
      }
      setContactsFile(file);
    },
    [classifyContacts]
  );

  const handleStart = useCallback(() => {
    if (!dbFile && !backup) return;
    setPasswordError(null);
    setProgress(0);
    setProgressMsg("opening file…");
    setScreen("loading");

    const worker = new Worker("/worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") {
        const pct = Math.max(0, Math.min(100, m.pct || 0));
        setProgress(pct);
        setProgressMsg(m.msg || `parsing…`);
      } else if (m.type === "done") {
        setStats(m.stats);
        setScreen("story");
        worker.terminate();
      } else if (m.type === "error") {
        // A bad backup password is a normal thing to get wrong — send people
        // back to the form with the field flagged rather than a dead end.
        if (m.code === "WRONG_PASSWORD") {
          setPasswordError("That password didn't work. Try again?");
          setScreen("landing");
        } else if (m.code === "MANIFEST_DB_MISSING") {
          setPasswordError(
            "This backup is encrypted but incomplete. Make a fresh backup and try again."
          );
          setScreen("landing");
        } else {
          setProgressMsg("something broke — " + m.error.split("\n")[0]);
        }
        console.error("[textstat worker]", m.error);
        worker.terminate();
      }
    };

    worker.postMessage(
      backup
        ? { type: "parse", backup, password }
        : { type: "parse", file: dbFile, contactsFile: contactsFile || null }
    );
  }, [dbFile, contactsFile, backup, password]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 overflow-y-auto bg-[radial-gradient(1200px_800px_at_90%_-10%,rgba(255,46,99,.35),transparent_60%),radial-gradient(1000px_700px_at_-10%_110%,rgba(108,37,196,.45),transparent_60%),radial-gradient(900px_600px_at_50%_50%,rgba(0,214,255,.10),transparent_60%),#0d0114]"
          >
            <AnimatedBackground />
            <div className="relative mx-auto w-[min(880px,92vw)] px-0 py-8 pb-16 pt-8">
              <div className="mb-8 inline-flex items-center gap-[0.55rem] rounded-full border border-white/20 px-[0.9rem] py-[0.35rem] font-mono text-xs uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
                <Sparkles className="text-[#aef639]" size={14} />
                <span>textstat</span>
              </div>

              {!platform ? (
                <PlatformPicker onSelect={handlePlatformSelect} />
              ) : (
                <PlatformGuide
                  platform={platform}
                  os={os}
                  onBack={handleBack}
                  dbFile={dbFile}
                  contactsFile={contactsFile}
                  backup={backup}
                  backupInfo={backupInfo}
                  probing={probing}
                  password={password}
                  passwordError={passwordError}
                  onDbFile={handleDbFile}
                  onContactsFile={handleContactsFile}
                  onBundle={handleBundle}
                  onSingleFile={handleSingleFile}
                  onPassword={(p) => {
                    setPassword(p);
                    setPasswordError(null);
                  }}
                  onRemoveDb={() => setDbFile(null)}
                  onRemoveContacts={() => setContactsFile(null)}
                  onStart={handleStart}
                />
              )}
            </div>
          </motion.div>
        )}

        {screen === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0"
          >
            <LoadingScreen
              progress={progress}
              statusMsg={progressMsg}
            />
          </motion.div>
        )}

        {screen === "story" && stats && (
          <motion.div
            key="story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0"
          >
            <Slideshow stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
