"use client";

import { motion } from "framer-motion";

export function AndroidGuide() {
  const steps = [
    {
      step: 1,
      body: (
        <>
          <p>
            Install{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.riteshsahu.SMSBackupRestore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00d6ff] underline underline-offset-[0.2em] hover:text-[#aef639]"
            >
              SMS Backup &amp; Restore
            </a>{" "}
            from the Google Play Store.
          </p>
          <div className="flex min-h-[80px] max-w-[460px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] p-5 text-[0.82rem] text-white/50">
            <span>[ Screenshot: Play Store listing ]</span>
          </div>
        </>
      ),
    },
    {
      step: 2,
      body: (
        <>
          <p>
            Open the app and tap <strong>SET UP A BACKUP</strong>.
          </p>
          <div className="flex min-h-[80px] max-w-[460px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] p-5 text-[0.82rem] text-white/50">
            <span>[ Screenshot: SMS Backup &amp; Restore home screen ]</span>
          </div>
        </>
      ),
    },
    {
      step: 3,
      body: (
        <>
          <p>
            Make sure <strong>Messages</strong> (SMS &amp; MMS) is toggled on.
            Choose where to save the backup, then tap{" "}
            <strong>BACK UP NOW</strong>.
          </p>
          <div className="flex min-h-[80px] max-w-[460px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] p-5 text-[0.82rem] text-white/50">
            <span>[ Screenshot: Backup settings screen ]</span>
          </div>
        </>
      ),
    },
    {
      step: 4,
      body: (
        <p>
          Transfer the XML file to your computer (email, Google Drive, USB,
          etc.).
          <br />
          It will be named something like{" "}
          <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">
            sms-2025-12-31.xml
          </code>
          .
        </p>
      ),
    },
    {
      step: 5,
      body: (
        <>
          <p>
            Drag that{" "}
            <code className="rounded-md bg-white/10 px-[0.45rem] py-[0.15rem] font-mono text-[0.9em]">
              .xml
            </code>{" "}
            file into the drop zone below.
          </p>
          <div className="flex min-h-[80px] max-w-[460px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] p-5 text-[0.82rem] text-white/50">
            <span>[ Screenshot: XML file on your desktop ]</span>
          </div>
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
        You&apos;ll need the SMS Backup &amp; Restore app
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
