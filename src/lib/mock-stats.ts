import { DayEntry, TextStatStats } from "@/types/stats";

function mockCalendar(): DayEntry[] {
  const days: DayEntry[] = [];
  const start = new Date(2025, 0, 1);
  for (let i = 0; i < 365; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const wave = Math.sin(i / 8) * 9 + Math.cos(i / 19) * 6;
    const weekend = date.getDay() === 0 || date.getDay() === 6 ? 10 : 0;
    const count = i % 17 === 0 ? 0 : Math.max(1, Math.round(18 + wave + weekend + (i % 7)));
    days.push({
      ymd: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      count,
    });
  }
  return days;
}

const sentWords = [
  ["literally", 418], ["okay", 376], ["wait", 331], ["dinner", 284],
  ["love", 271], ["tomorrow", 238], ["actually", 211], ["home", 196],
  ["perfect", 181], ["sorry", 164], ["weekend", 149], ["please", 136],
] as const;
const recvWords = [
  ["haha", 402], ["yes", 355], ["right", 319], ["maybe", 276],
  ["great", 259], ["morning", 231], ["tonight", 218], ["thanks", 192],
  ["wild", 177], ["coming", 158], ["absolutely", 142], ["soon", 129],
] as const;

export const MOCK_STATS: TextStatStats = {
  summary: {
    totalMessages: 48291,
    totalSent: 25184,
    totalRecv: 23107,
    sentSms: 1920,
    recvSms: 1812,
    sentMms: 704,
    recvMms: 655,
    charsSent: 956442,
    charsRecv: 881230,
    firstTs: new Date("2021-01-03T15:42:00").getTime(),
    lastTs: new Date("2025-12-31T23:18:00").getTime(),
    activeDays: 1718,
    totalDays: 1824,
    uniqueContacts: 86,
    uniqueGroups: 14,
    rcsCount: 0,
    reactionsSent: 1832,
    reactionsRecv: 2147,
    attachmentCount: 4392,
    editedCount: 128,
    retractedCount: 31,
    serviceCounts: { iMessage: 44102, SMS: 4189 },
    avgPerDay: 26.5,
    lateNightSentPct: 12.8,
    earlyBirdSentPct: 6.4,
    peakHour: 21,
    peakDow: 5,
    longestStreak: 143,
    streakStart: "2025-03-12",
    streakEnd: "2025-08-01",
    busiest: { ymd: "2025-07-19", count: 387 },
    longestBody: {
      len: 1482,
      preview: "I have been trying to find the right way to say this, because it deserves more than a quick reply. You made a difficult year feel possible, and I hope you know how much that mattered to me.",
      contact: "Maya Chen",
      photo: null,
      sent: false,
      ts: new Date("2025-09-14T20:11:00").getTime(),
    },
    longestSentBody: {
      len: 1026,
      preview: "Here is the full plan so nobody has to search through fifty messages tomorrow: coffee at nine, train at ten fifteen, lunch when we arrive, and absolutely no one is allowed to forget the tickets.",
      contact: "Weekend Plans",
      photo: null,
      sent: true,
      ts: new Date("2025-06-21T18:04:00").getTime(),
    },
    longestRecvBody: {
      len: 1482,
      preview: "I have been trying to find the right way to say this, because it deserves more than a quick reply. You made a difficult year feel possible, and I hope you know how much that mattered to me.",
      contact: "Maya Chen",
      photo: null,
      sent: false,
      ts: new Date("2025-09-14T20:11:00").getTime(),
    },
    longestSentRun: {
      count: 11,
      displayName: "Alex Rivera",
      photo: null,
      messages: [
        "wait", "one more thing", "did you see the reservation?", "because it moved to 7:30",
        "which is honestly better", "also I invited Sam", "hope that is okay", "they are bringing dessert",
        "I can drive", "hello?", "this is my final message I promise",
      ],
    },
  },
  topContacts: [
    { displayName: "Maya Chen", sent: 3912, recv: 4268, total: 8180, charsSent: 162400, charsRecv: 171200, photo: null, address: "+15550101" },
    { displayName: "Alex Rivera", sent: 3680, recv: 2140, total: 5820, charsSent: 140100, charsRecv: 82300, photo: null, address: "+15550102" },
    { displayName: "Jordan Kim", sent: 1450, recv: 3010, total: 4460, charsSent: 59200, charsRecv: 121800, photo: null, address: "+15550103" },
    { displayName: "Sam Patel", sent: 1862, recv: 1744, total: 3606, charsSent: 71000, charsRecv: 69200, photo: null, address: "+15550104" },
    { displayName: "Mom", sent: 1284, recv: 1632, total: 2916, charsSent: 48200, charsRecv: 64200, photo: null, address: "+15550105" },
    { displayName: "Taylor Brooks", sent: 1108, recv: 994, total: 2102, charsSent: 43100, charsRecv: 39800, photo: null, address: "+15550106" },
    { displayName: "Chris Lee", sent: 842, recv: 936, total: 1778, charsSent: 31900, charsRecv: 35200, photo: null, address: "+15550107" },
    { displayName: "Nina Shah", sent: 706, recv: 682, total: 1388, charsSent: 27100, charsRecv: 26300, photo: null, address: "+15550108" },
  ],
  groups: [
    { name: "Weekend Plans", count: 3462, participants: 6, participantPhotos: [], participantNames: ["Maya", "Alex", "Jordan", "Sam", "Nina", "You"] },
    { name: "Family", count: 2144, participants: 5, participantPhotos: [], participantNames: ["Mom", "Dad", "Avery", "Jamie", "You"] },
    { name: "Apartment 4B", count: 1182, participants: 4, participantPhotos: [], participantNames: ["Taylor", "Chris", "Nina", "You"] },
  ],
  months: [
    742, 801, 784, 862, 910, 955, 1028, 986, 934, 1042, 1108, 1196,
  ].map((count, i) => ({ key: `2025-${String(i + 1).padStart(2, "0")}`, count })),
  hourSent: [122, 84, 51, 32, 28, 44, 116, 302, 618, 742, 811, 886, 1012, 978, 934, 1088, 1260, 1494, 1762, 2040, 2378, 2542, 1812, 1032],
  hourRecv: [148, 102, 64, 41, 33, 56, 138, 336, 580, 688, 762, 804, 936, 902, 884, 1012, 1198, 1380, 1610, 1884, 2118, 2246, 1630, 1080],
  dowSent: [2860, 3220, 3418, 3540, 3692, 4288, 4166],
  dowRecv: [2712, 3018, 3164, 3298, 3470, 3892, 3553],
  calDays: mockCalendar(),
  topWords: [...sentWords, ...recvWords]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count),
  topWordsSent: sentWords.map(([word, count]) => ({ word, count })),
  topWordsRecv: recvWords.map(([word, count]) => ({ word, count })),
  topEmojis: [
    { emoji: "😂", count: 1248 }, { emoji: "❤️", count: 982 }, { emoji: "😭", count: 836 },
    { emoji: "✨", count: 612 }, { emoji: "🫡", count: 488 }, { emoji: "🥹", count: 421 },
    { emoji: "👍", count: 398 }, { emoji: "🎉", count: 336 },
  ],
  topEmojisSent: [
    { emoji: "😂", count: 692 }, { emoji: "❤️", count: 481 }, { emoji: "🫡", count: 308 },
    { emoji: "✨", count: 276 }, { emoji: "😭", count: 264 }, { emoji: "🎉", count: 188 },
  ],
  topEmojisRecv: [
    { emoji: "😂", count: 556 }, { emoji: "❤️", count: 501 }, { emoji: "😭", count: 572 },
    { emoji: "✨", count: 336 }, { emoji: "🥹", count: 295 }, { emoji: "👍", count: 246 },
  ],
  topReactions: [
    { emoji: "❤️", count: 1584 }, { emoji: "😂", count: 1106 }, { emoji: "👍", count: 624 },
    { emoji: "‼️", count: 312 }, { emoji: "?", count: 201 }, { emoji: "👎", count: 152 },
  ],
};
