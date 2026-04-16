import api from './index';

export const getTiktokInsights = async (clientId) => {
  const response = await api.get(`/clients/${clientId}/tiktok/insights`);
  return response.data;
};

