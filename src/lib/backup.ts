"use client";

// ---------------------------------------------------------------------------
// iOS local backup discovery.
//
// A backup stores every file under the SHA-1 of "<domain>-<relative path>",
// inside a subfolder named after the hash's first two hex characters. The
// filenames are identical in encrypted backups — only the contents are
// ciphertext — so we can always locate what we need without enumerating the
// ~100k files a backup contains.
// ---------------------------------------------------------------------------

export const BACKUP_HASHES = {
  // HomeDomain-Library/SMS/sms.db
  sms: "3d0d7e5fb2ce288813306e4d4636395e047a3d28",
  // HomeDomain-Library/AddressBook/AddressBook.sqlitedb
  addressBook: "31bb7ba8914766d4ba40d6dfb6113c8b614be442",
  // HomeDomain-Library/AddressBook/AddressBookImages.sqlitedb
  addressBookImages: "cd6702cea29fe89cf280a76794405adb17f9a0ee",
} as const;

export const MANIFEST_PLIST = "Manifest.plist";
export const MANIFEST_DB = "Manifest.db";

export interface BackupBundle {
  sms: File;
  addressBook: File | null;
  addressBookImages: File | null;
  manifestDb: File | null;
  manifestPlist: File | null;
  folderName: string;
}

export type BackupScanResult =
  | { ok: true; bundle: BackupBundle }
  // A backup folder was recognised but sms.db was missing from it.
  | { ok: false; reason: "no-messages"; folderName: string }
  // Nothing that looks like a backup was found in the dropped folder.
  | { ok: false; reason: "not-a-backup" };

// Both candidate locations for a hashed file: the modern 2-char subfolder
// layout, and the flat layout used by iOS 9 and earlier.
function hashPaths(hash: string): string[] {
  return [`${hash.slice(0, 2)}/${hash}`, hash];
}

// ---------------------------------------------------------------------------
// File System Access API (Chromium): direct lookups, zero enumeration
// ---------------------------------------------------------------------------

interface DirHandle {
  kind: "directory";
  name: string;
  getFileHandle(name: string): Promise<{ getFile(): Promise<File> }>;
  getDirectoryHandle(name: string): Promise<DirHandle>;
  values(): AsyncIterableIterator<DirHandle | { kind: "file"; name: string }>;
}

async function fsaGet(dir: DirHandle, path: string): Promise<File | null> {
  try {
    const parts = path.split("/");
    let cur = dir;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = await cur.getDirectoryHandle(parts[i]);
    }
    const fh = await cur.getFileHandle(parts[parts.length - 1]);
    return await fh.getFile();
  } catch {
    return null;
  }
}

async function fsaGetAny(dir: DirHandle, hash: string): Promise<File | null> {
  for (const p of hashPaths(hash)) {
    const f = await fsaGet(dir, p);
    if (f) return f;
  }
  return null;
}

export async function pickBackupFolder(): Promise<BackupScanResult | null> {
  const w = window as Window & {
    showDirectoryPicker?: (opts?: { mode?: string; id?: string }) => Promise<DirHandle>;
  };
  if (!w.showDirectoryPicker) return null;
  let handle: DirHandle;
  try {
    handle = await w.showDirectoryPicker({ mode: "read", id: "textstat-backup" });
  } catch {
    return null; // user cancelled
  }
  return scanDirHandle(handle);
}

async function scanDirHandle(dir: DirHandle): Promise<BackupScanResult> {
  // The picked folder is either a single backup (has Manifest.plist) or the
  // MobileSync/Backup root holding one folder per device.
  let target: DirHandle | null = null;
  if (await fsaGet(dir, MANIFEST_PLIST)) {
    target = dir;
  } else {
    let newest = -1;
    for await (const entry of dir.values()) {
      if (entry.kind !== "directory") continue;
      const sub = entry as DirHandle;
      const manifest = await fsaGet(sub, MANIFEST_PLIST);
      if (manifest && manifest.lastModified > newest) {
        newest = manifest.lastModified;
        target = sub;
      }
    }
  }
  if (!target) return { ok: false, reason: "not-a-backup" };

  const sms = await fsaGetAny(target, BACKUP_HASHES.sms);
  if (!sms) return { ok: false, reason: "no-messages", folderName: target.name };

  return {
    ok: true,
    bundle: {
      sms,
      addressBook: await fsaGetAny(target, BACKUP_HASHES.addressBook),
      addressBookImages: await fsaGetAny(target, BACKUP_HASHES.addressBookImages),
      manifestDb: await fsaGet(target, MANIFEST_DB),
      manifestPlist: await fsaGet(target, MANIFEST_PLIST),
      folderName: target.name,
    },
  };
}

// ---------------------------------------------------------------------------
// Drag-and-drop (all browsers): FileSystemDirectoryEntry also supports relative
// path lookups, so this stays enumeration-free too.
// ---------------------------------------------------------------------------

interface DirEntry {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  getFile(
    path: string,
    opts: Record<string, never>,
    ok: (e: { file(cb: (f: File) => void, err: () => void): void }) => void,
    err: () => void
  ): void;
  createReader(): { readEntries(cb: (entries: DirEntry[]) => void, err?: () => void): void };
}

function entryGet(dir: DirEntry, path: string): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      dir.getFile(
        path,
        {},
        (fe) => fe.file((f) => resolve(f), () => resolve(null)),
        () => resolve(null)
      );
    } catch {
      resolve(null);
    }
  });
}

async function entryGetAny(dir: DirEntry, hash: string): Promise<File | null> {
  for (const p of hashPaths(hash)) {
    const f = await entryGet(dir, p);
    if (f) return f;
  }
  return null;
}

function readDir(dir: DirEntry): Promise<DirEntry[]> {
  return new Promise((resolve) => {
    const reader = dir.createReader();
    const all: DirEntry[] = [];
    const step = () =>
      reader.readEntries((entries) => {
        if (!entries.length) return resolve(all);
        all.push(...entries);
        step();
      }, () => resolve(all));
    step();
  });
}

export async function scanDroppedEntry(entry: DirEntry): Promise<BackupScanResult> {
  let target: DirEntry | null = null;
  if (await entryGet(entry, MANIFEST_PLIST)) {
    target = entry;
  } else {
    let newest = -1;
    // Only one shallow read of the picked root — device folders live here.
    for (const sub of await readDir(entry)) {
      if (!sub.isDirectory) continue;
      const manifest = await entryGet(sub, MANIFEST_PLIST);
      if (manifest && manifest.lastModified > newest) {
        newest = manifest.lastModified;
        target = sub;
      }
    }
  }
  if (!target) return { ok: false, reason: "not-a-backup" };

  const sms = await entryGetAny(target, BACKUP_HASHES.sms);
  if (!sms) return { ok: false, reason: "no-messages", folderName: target.name };

  return {
    ok: true,
    bundle: {
      sms,
      addressBook: await entryGetAny(target, BACKUP_HASHES.addressBook),
      addressBookImages: await entryGetAny(target, BACKUP_HASHES.addressBookImages),
      manifestDb: await entryGet(target, MANIFEST_DB),
      manifestPlist: await entryGet(target, MANIFEST_PLIST),
      folderName: target.name,
    },
  };
}

// ---------------------------------------------------------------------------
// <input webkitdirectory> fallback (Firefox / Safari): the browser hands us a
// flat FileList, so match on webkitRelativePath.
// ---------------------------------------------------------------------------

interface RelFile extends File {
  webkitRelativePath: string;
}

export function scanFileList(files: File[]): BackupScanResult {
  if (!files.length) return { ok: false, reason: "not-a-backup" };

  // Group by the directory that directly contains Manifest.plist.
  const manifests = new Map<string, File>();
  for (const f of files) {
    if (f.name !== MANIFEST_PLIST) continue;
    const rel = (f as RelFile).webkitRelativePath || f.name;
    manifests.set(rel.slice(0, rel.lastIndexOf("/") + 1), f);
  }
  if (!manifests.size) return { ok: false, reason: "not-a-backup" };

  let prefix = "";
  let newest = -1;
  for (const [p, f] of manifests) {
    if (f.lastModified > newest) {
      newest = f.lastModified;
      prefix = p;
    }
  }

  const within = files.filter((f) =>
    ((f as RelFile).webkitRelativePath || f.name).startsWith(prefix)
  );
  const find = (name: string) =>
    within.find((f) => f.name.toLowerCase() === name.toLowerCase()) || null;

  const sms = find(BACKUP_HASHES.sms);
  const folderName = prefix.replace(/\/$/, "").split("/").pop() || "backup";
  if (!sms) return { ok: false, reason: "no-messages", folderName };

  return {
    ok: true,
    bundle: {
      sms,
      addressBook: find(BACKUP_HASHES.addressBook),
      addressBookImages: find(BACKUP_HASHES.addressBookImages),
      manifestDb: find(MANIFEST_DB),
      manifestPlist: find(MANIFEST_PLIST),
      folderName,
    },
  };
}

// ---------------------------------------------------------------------------
// Single-file classification, for people who drag a bare chat.db / .xml / .vcf
// ---------------------------------------------------------------------------

export type SingleFileKind = "messages" | "contacts" | "unknown";

export async function classifyFile(file: File): Promise<SingleFileKind> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".vcf")) return "contacts";
  if (name.endsWith(".xml")) return "messages";
  if (name === BACKUP_HASHES.addressBook) return "contacts";

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const text = new TextDecoder().decode(head);
  if (text.startsWith("BEGIN:VCARD")) return "contacts";
  if (text.startsWith("<?xml")) return "messages";
  if (text.startsWith("SQLite format 3")) {
    // chat.db, sms.db and AddressBook.sqlitedb all share this magic; the
    // filename disambiguates, and anything else SQLite we treat as messages.
    if (name.includes("addressbook")) return "contacts";
    return "messages";
  }
  return "unknown";
}
