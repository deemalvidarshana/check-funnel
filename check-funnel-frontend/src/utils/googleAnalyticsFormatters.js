export function formatGaNumber(value, options = {}) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(number);
}

export function formatGaMoney(value, currency = 'USD', compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(Number(value || 0));
}

export function formatGaPercent(value, digits = 1) {
  return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

export function formatGaChange(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`;
}

export function googleAnalyticsErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || error?.message || 'Unable to load Google Analytics data.';
}
