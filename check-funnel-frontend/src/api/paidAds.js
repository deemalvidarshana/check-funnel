import api from './index';

export async function getPaidAdsInsights(clientId, month, range = {}) {
  const response = await api.get(`/paid-ads/${clientId}/insights`, {
    params: { month, ...range },
    timeout: 90000,
  });
  return response.data;
}

export async function getPaidAdsMonthlyComparison(clientId, months) {
  const response = await api.get(`/paid-ads/${clientId}/monthly-comparison`, {
    params: { months: months.join(',') },
    timeout: 90000,
  });
  return response.data;
}

export async function getPaidAdsRangeMonthlyComparison(clientId, range) {
  const response = await api.get(`/paid-ads/${clientId}/range-monthly-comparison`, {
    params: range,
    timeout: 90000,
  });
  return response.data;
}
