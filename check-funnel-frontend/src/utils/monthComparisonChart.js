const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

const generateMonthWeekRanges = (monthDate, endDate, maxWeeks) => {
  const ranges = [];
  const cursor = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const finalDate = endDate && endDate < monthEnd ? endDate : monthEnd;

  while (cursor <= finalDate && (!maxWeeks || ranges.length < maxWeeks)) {
    const sinceDate = new Date(cursor);
    const untilDate = new Date(cursor);
    untilDate.setDate(untilDate.getDate() + 6);
    if (untilDate > finalDate) untilDate.setTime(finalDate.getTime());

    ranges.push({
      label: `Week ${ranges.length + 1} (${sinceDate.getDate()}-${untilDate.getDate()})`,
      since: formatLocalDate(sinceDate),
      until: formatLocalDate(untilDate),
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return ranges;
};

export const buildMonthComparisonRanges = (today = new Date()) => {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const currentRanges = generateMonthWeekRanges(currentMonth, today);
  const lastRanges = generateMonthWeekRanges(
    lastMonth,
    new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
    currentRanges.length
  );

  return {
    currentLabel: formatMonthLabel(currentMonth),
    previousLabel: formatMonthLabel(lastMonth),
    currentRanges,
    previousRanges: lastRanges,
  };
};
