export interface ContactEntry {
  displayName: string;
  sent: number;
  recv: number;
  total: number;
  charsSent: number;
  charsRecv: number;
  photo: string | null;
  address: string;
}

export interface GroupEntry {
  name: string;
  count: number;
  participants: number;
  participantPhotos: string[];
  participantNames: string[];
}

export interface WordEntry {
  word: string;
  count: number;
}

export interface EmojiEntry {
  emoji: string;
  count: number;
}

export interface MonthEntry {
  key: string;
  count: number;
}

export interface DayEntry {
  ymd: string;
  count: number;
}

export interface BusiestDay {
  ymd: string | null;
  count: number;
}

export interface LongestBody {
  len: number;
  preview: string;
  contact: string;
  photo: string | null;
  sent: boolean;
  ts: number;
}

export interface Summary {
  totalMessages: number;
  totalSent: number;
  totalRecv: number;
  sentSms: number;
  recvSms: number;
  sentMms: number;
  recvMms: number;
  charsSent: number;
  charsRecv: number;
  firstTs: number | null;
  lastTs: number | null;
  activeDays: number;
  totalDays: number;
  uniqueContacts: number;
  uniqueGroups: number;
  rcsCount: number;
  reactionsSent: number;
  reactionsRecv: number;
  attachmentCount: number;
  editedCount: number;
  retractedCount: number;
  serviceCounts: Record<string, number> | null;
  avgPerDay: number;
  lateNightSentPct: number;
  earlyBirdSentPct: number;
  peakHour: number;
  peakDow: number;
  longestStreak: number;
  streakStart: string | null;
  streakEnd: string | null;
  busiest: BusiestDay;
  longestBody: LongestBody | null;
  longestSentBody: LongestBody | null;
  longestRecvBody: LongestBody | null;
  longestSentRun: { count: number; displayName: string; photo: string | null; messages: string[] } | null;
}

export interface TextStatStats {
  summary: Summary;
  topContacts: ContactEntry[];
  groups: GroupEntry[];
  months: MonthEntry[];
  hourSent: number[];
  hourRecv: number[];
  dowSent: number[];
  dowRecv: number[];
  calDays: DayEntry[];
  topWords: WordEntry[];
  topWordsSent: WordEntry[];
  topWordsRecv: WordEntry[];
  topEmojis: EmojiEntry[];
  topEmojisSent: EmojiEntry[];
  topEmojisRecv: EmojiEntry[];
  topReactions: EmojiEntry[];
}

export type Platform = "iphone" | "android";
export type Screen = "landing" | "loading" | "story";
