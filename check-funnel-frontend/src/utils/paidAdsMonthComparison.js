export function defaultComparisonMonths(anchor) {
  const [year, monthNumber] = anchor.split('-').map(Number);
  return [-3, -2, -1, 0].map(offset => {
    const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}
