export const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
] as const;

export function resolveRange(range: string | undefined): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return { from: startOfToday, to: now };
    case "yesterday": {
      const from = new Date(startOfToday.getTime() - 86400_000);
      return { from, to: startOfToday };
    }
    case "90d":
      return { from: new Date(now.getTime() - 90 * 86400_000), to: now };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 86400_000), to: now };
    case "7d":
    default:
      return { from: new Date(now.getTime() - 7 * 86400_000), to: now };
  }
}
