export type DeadlineUrgency = "safe" | "warning" | "critical";

export interface CbamDeadline {
  period: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  date: Date;
  label: string;
}

/** All 2026 + 2027 CBAM quarterly declaration deadlines (UTC). */
export const CBAM_DEADLINES: CbamDeadline[] = [
  {
    period: "Q1 2026",
    quarter: "Q1",
    year: 2026,
    date: new Date(Date.UTC(2026, 3, 30)),
    label: "Q1 2026 CBAM Declaration",
  },
  {
    period: "Q2 2026",
    quarter: "Q2",
    year: 2026,
    date: new Date(Date.UTC(2026, 6, 31)),
    label: "Q2 2026 CBAM Declaration",
  },
  {
    period: "Q3 2026",
    quarter: "Q3",
    year: 2026,
    date: new Date(Date.UTC(2026, 9, 31)),
    label: "Q3 2026 CBAM Declaration",
  },
  {
    period: "Q4 2026",
    quarter: "Q4",
    year: 2026,
    date: new Date(Date.UTC(2027, 0, 31)),
    label: "Q4 2026 CBAM Declaration",
  },
  {
    period: "Q1 2027",
    quarter: "Q1",
    year: 2027,
    date: new Date(Date.UTC(2027, 3, 30)),
    label: "Q1 2027 CBAM Declaration",
  },
  {
    period: "Q2 2027",
    quarter: "Q2",
    year: 2027,
    date: new Date(Date.UTC(2027, 6, 31)),
    label: "Q2 2027 CBAM Declaration",
  },
  {
    period: "Q3 2027",
    quarter: "Q3",
    year: 2027,
    date: new Date(Date.UTC(2027, 9, 31)),
    label: "Q3 2027 CBAM Declaration",
  },
  {
    period: "Q4 2027",
    quarter: "Q4",
    year: 2027,
    date: new Date(Date.UTC(2028, 0, 31)),
    label: "Q4 2027 CBAM Declaration",
  },
];

/**
 * Returns the next upcoming CBAM deadline.
 * Falls back to the last known deadline if all have passed.
 */
export function getNextDeadline(): CbamDeadline {
  const now = new Date();
  return (
    CBAM_DEADLINES.find((d) => d.date > now) ??
    CBAM_DEADLINES[CBAM_DEADLINES.length - 1]
  );
}

/** Returns number of calendar days until the next CBAM deadline. */
export function getDaysUntilDeadline(): number {
  const next = getNextDeadline();
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((next.date.getTime() - now.getTime()) / msPerDay);
}

/**
 * Returns urgency level based on days remaining.
 * - safe: > 60 days
 * - warning: 30–60 days
 * - critical: < 30 days
 */
export function getDeadlineUrgency(): DeadlineUrgency {
  const days = getDaysUntilDeadline();
  if (days < 30) return "critical";
  if (days <= 60) return "warning";
  return "safe";
}
