const SCHEDULE_TIME_ZONE_OFFSET = "+05:30";

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function parseScheduleDate(dateValue, timeValue = "00:00") {
  if (!dateValue) return null;

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (!dateValue.includes("-")) return null;

  const parts = dateValue.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const [first, second, third] = parts;
  const isIsoFormat = String(first).length === 4;
  const year = isIsoFormat ? first : third;
  const month = second;
  const day = isIsoFormat ? third : first;

  const isoDateTime = `${year}-${padDatePart(month)}-${padDatePart(day)}T${padDatePart(hours)}:${padDatePart(minutes)}:00${SCHEDULE_TIME_ZONE_OFFSET}`;
  const parsed = new Date(isoDateTime);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateInputValue(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}
