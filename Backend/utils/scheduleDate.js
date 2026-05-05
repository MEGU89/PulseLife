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

  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
}

export function formatDateInputValue(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}
