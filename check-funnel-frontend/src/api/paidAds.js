import api from './index';

export async function getPaidAdsInsights(clientId, month) {
  const response = await api.get(`/paid-ads/${clientId}/insights`, {
    params: { month },
    timeout: 90000,
  });
  return response.data;
}
