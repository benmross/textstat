"use client";

interface FileChipProps {
  fileName: string;
  fileSize: string;
  onRemove: () => void;
}

export function FileChip({ fileName, fileSize, onRemove }: FileChipProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#aef6394d] bg-[#aef6391f] px-[0.7rem] py-[0.45rem] text-[0.82rem] text-[#aef639]">
      <span className="text-xs font-extrabold flex-none">✓</span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {fileName} · {fileSize}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="grid h-5 w-5 flex-none place-items-center rounded-full bg-white/10 text-white/60 text-xs leading-none transition-colors hover:bg-[#ff2e63] hover:text-white"
      >
        ×
      </button>
    </span>
  );
}
