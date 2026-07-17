// budget: 400 lines
// All ranges are computed in UTC to keep revenue / dashboard totals deterministic
// across server timezones (see plan Risks: timezone consistency).

export interface DateRange {
  start: Date;
  end: Date; // exclusive upper bound
}

/** Start (00:00:00.000) and next-day start for a given instant, in UTC. */
export function dayRange(now: Date): DateRange {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** Day range for a plain YYYY-MM-DD string, in UTC. */
export function dayRangeFromString(date: string): DateRange {
  const [y, m, d] = date.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** Current week Monday 00:00 UTC → next Monday 00:00 UTC (Mon–Sun window). */
export function weekRange(now: Date): DateRange {
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
  const diffToMonday = (day + 6) % 7; // days since Monday
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  start.setUTCDate(start.getUTCDate() - diffToMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

/** Current calendar month range, in UTC. */
export function monthRange(now: Date): DateRange {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}
