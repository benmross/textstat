"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconShadow?: string;
  hasFile?: boolean;
}

export function Dropzone({
  onFileSelected,
  accept,
  label = "Click or drag your file here",
  hint = "chat.db or sms-*.xml",
  icon,
  iconBg = "linear-gradient(135deg, #ff2e63, #ffd60a)",
  iconShadow = "rgba(255,46,99,.45)",
  hasFile = false,
}: DropzoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("!border-[#aef639]", "!bg-[#aef63914]");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("!border-[#aef639]", "!bg-[#aef63914]");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove("!border-[#aef639]", "!bg-[#aef63914]");

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) onFileSelected(files[0]);
    },
    [onFileSelected]
  );

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`cursor-pointer rounded-[28px] border-2 bg-white/[0.03] transition-all ${
        hasFile
          ? "border-[#aef639] border-solid bg-[#aef6390f]"
          : "border-dashed border-white/25 hover:border-[#aef639] hover:bg-[#aef63914]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.getElementById(
          "fileInput-" + label.replace(/\s/g, "")
        ) as HTMLInputElement;
        input?.click();
      }}
    >
      <input
        type="file"
        id={"fileInput-" + label.replace(/\s/g, "")}
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFileSelected(files[0]);
        }}
      />
      <div className="flex items-center gap-4 p-4">
        <div
          className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl text-[1.4rem] font-extrabold text-[#0d0114]"
          style={{
            background: iconBg,
            boxShadow: `0 8px 24px -6px ${iconShadow}`,
          }}
        >
          {icon ?? <Upload size={22} />}
        </div>
        <div className="flex flex-col gap-1">
          <strong className="text-[0.95rem] font-bold">{label}</strong>
          <span className="text-[0.8rem] text-white/60">{hint}</span>
        </div>
      </div>
    </motion.div>
  );
}
