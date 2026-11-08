// A calendar date as 'YYYY-MM-DD', the same shape the API and the `date` columns use.
export type CalendarDate = string;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMs(date: CalendarDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return Date.UTC(year, month - 1, day);
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Round-trips through Date to reject impossible dates such as 2026-02-30.
  return new Date(toUtcMs(value)).toISOString().startsWith(value);
}

// Whole calendar days from `from` to `to` (negative when `to` is earlier).
// Going through UTC avoids daylight-saving shifts changing the day count.
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

// The 'en-CA' locale formats dates as YYYY-MM-DD.
export function toCalendarDate(instant: Date, timeZone = 'America/Sao_Paulo'): CalendarDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}
