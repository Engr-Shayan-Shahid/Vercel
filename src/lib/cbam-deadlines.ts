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
  {
    period: "Q1 2028",
    quarter: "Q1",
    year: 2028,
    date: new Date(Date.UTC(2028, 3, 30)),
    label: "Q1 2028 CBAM Declaration",
  },
  {
    period: "Q2 2028",
    quarter: "Q2",
    year: 2028,
    date: new Date(Date.UTC(2028, 6, 31)),
    label: "Q2 2028 CBAM Declaration",
  },
  {
    period: "Q3 2028",
    quarter: "Q3",
    year: 2028,
    date: new Date(Date.UTC(2028, 9, 31)),
    label: "Q3 2028 CBAM Declaration",
  },
  {
    period: "Q4 2028",
    quarter: "Q4",
    year: 2028,
    date: new Date(Date.UTC(2029, 0, 31)),
    label: "Q4 2028 CBAM Declaration",
  },
  {
    period: "Q1 2029",
    quarter: "Q1",
    year: 2029,
    date: new Date(Date.UTC(2029, 3, 30)),
    label: "Q1 2029 CBAM Declaration",
  },
  {
    period: "Q2 2029",
    quarter: "Q2",
    year: 2029,
    date: new Date(Date.UTC(2029, 6, 31)),
    label: "Q2 2029 CBAM Declaration",
  },
  {
    period: "Q3 2029",
    quarter: "Q3",
    year: 2029,
    date: new Date(Date.UTC(2029, 9, 31)),
    label: "Q3 2029 CBAM Declaration",
  },
  {
    period: "Q4 2029",
    quarter: "Q4",
    year: 2029,
    date: new Date(Date.UTC(2030, 0, 31)),
    label: "Q4 2029 CBAM Declaration",
  },
  {
    period: "Q1 2030",
    quarter: "Q1",
    year: 2030,
    date: new Date(Date.UTC(2030, 3, 30)),
    label: "Q1 2030 CBAM Declaration",
  },
  {
    period: "Q2 2030",
    quarter: "Q2",
    year: 2030,
    date: new Date(Date.UTC(2030, 6, 31)),
    label: "Q2 2030 CBAM Declaration",
  },
  {
    period: "Q3 2030",
    quarter: "Q3",
    year: 2030,
    date: new Date(Date.UTC(2030, 9, 31)),
    label: "Q3 2030 CBAM Declaration",
  },
  {
    period: "Q4 2030",
    quarter: "Q4",
    year: 2030,
    date: new Date(Date.UTC(2031, 0, 31)),
    label: "Q4 2030 CBAM Declaration",
  },
  {
    period: "Q1 2031",
    quarter: "Q1",
    year: 2031,
    date: new Date(Date.UTC(2031, 3, 30)),
    label: "Q1 2031 CBAM Declaration",
  },
  {
    period: "Q2 2031",
    quarter: "Q2",
    year: 2031,
    date: new Date(Date.UTC(2031, 6, 31)),
    label: "Q2 2031 CBAM Declaration",
  },
  {
    period: "Q3 2031",
    quarter: "Q3",
    year: 2031,
    date: new Date(Date.UTC(2031, 9, 31)),
    label: "Q3 2031 CBAM Declaration",
  },
  {
    period: "Q4 2031",
    quarter: "Q4",
    year: 2031,
    date: new Date(Date.UTC(2032, 0, 31)),
    label: "Q4 2031 CBAM Declaration",
  },
  {
    period: "Q1 2032",
    quarter: "Q1",
    year: 2032,
    date: new Date(Date.UTC(2032, 3, 30)),
    label: "Q1 2032 CBAM Declaration",
  },
  {
    period: "Q2 2032",
    quarter: "Q2",
    year: 2032,
    date: new Date(Date.UTC(2032, 6, 31)),
    label: "Q2 2032 CBAM Declaration",
  },
  {
    period: "Q3 2032",
    quarter: "Q3",
    year: 2032,
    date: new Date(Date.UTC(2032, 9, 31)),
    label: "Q3 2032 CBAM Declaration",
  },
  {
    period: "Q4 2032",
    quarter: "Q4",
    year: 2032,
    date: new Date(Date.UTC(2033, 0, 31)),
    label: "Q4 2032 CBAM Declaration",
  },
  {
    period: "Q1 2033",
    quarter: "Q1",
    year: 2033,
    date: new Date(Date.UTC(2033, 3, 30)),
    label: "Q1 2033 CBAM Declaration",
  },
  {
    period: "Q2 2033",
    quarter: "Q2",
    year: 2033,
    date: new Date(Date.UTC(2033, 6, 31)),
    label: "Q2 2033 CBAM Declaration",
  },
  {
    period: "Q3 2033",
    quarter: "Q3",
    year: 2033,
    date: new Date(Date.UTC(2033, 9, 31)),
    label: "Q3 2033 CBAM Declaration",
  },
  {
    period: "Q4 2033",
    quarter: "Q4",
    year: 2033,
    date: new Date(Date.UTC(2034, 0, 31)),
    label: "Q4 2033 CBAM Declaration",
  },
  {
    period: "Q1 2034",
    quarter: "Q1",
    year: 2034,
    date: new Date(Date.UTC(2034, 3, 30)),
    label: "Q1 2034 CBAM Declaration",
  },
  {
    period: "Q2 2034",
    quarter: "Q2",
    year: 2034,
    date: new Date(Date.UTC(2034, 6, 31)),
    label: "Q2 2034 CBAM Declaration",
  },
  {
    period: "Q3 2034",
    quarter: "Q3",
    year: 2034,
    date: new Date(Date.UTC(2034, 9, 31)),
    label: "Q3 2034 CBAM Declaration",
  },
  {
    period: "Q4 2034",
    quarter: "Q4",
    year: 2034,
    date: new Date(Date.UTC(2035, 0, 31)),
    label: "Q4 2034 CBAM Declaration",
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
