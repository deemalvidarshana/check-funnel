export function formatPaidAdsNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits });
}

export function formatPaidAdsMoney(value, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatPaidAdsChange(value) {
  if (value == null) return 'New';
  const numeric = Number(value);
  return `${numeric >= 0 ? '+' : ''}${numeric.toFixed(1)}%`;
}

export function paidAdsErrorMessage(error) {
  return error?.response?.data?.message?.message
    || error?.response?.data?.message
    || error?.message
    || 'Unable to load Meta Ads data.';
}
