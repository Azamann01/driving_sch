// UK time throughout. The server runs UTC, so anything not pinned here would
// read an hour out through British Summer Time.
const TZ = "Europe/London";

function ukParts(date: Date) {
  const [day, month, year] = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .split("/")
    .map(Number);

  return { day, month, year };
}

function daysBetween(a: Date, b: Date) {
  const pa = ukParts(a);
  const pb = ukParts(b);
  return Math.round(
    (Date.UTC(pb.year, pb.month - 1, pb.day) -
      Date.UTC(pa.year, pa.month - 1, pa.day)) /
      86_400_000
  );
}

// "Today" and "Tomorrow" mean the calendar day, not a 24 hour window: a lesson
// at 9am tomorrow is tomorrow even when it is only 14 hours away.
export function lessonDayLabel(start: Date, now: Date) {
  const diff = daysBetween(now, start);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return null;
}

export function formatLessonTime(start: Date) {
  return start.toLocaleString("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLessonClock(start: Date) {
  return start.toLocaleString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// How long an enquiry has been sitting. An enquiry nobody answered for four
// days is usually a lost customer, and that should be visible at a glance.
export function timeAgo(from: Date, now: Date) {
  const minutes = Math.floor((now.getTime() - from.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = daysBetween(from, now);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}
