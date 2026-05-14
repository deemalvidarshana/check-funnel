import api from './api';

export const getClientPosts = async (clientId, platform, from, to) => {
  const params = {};
  if (platform) params.platform = platform;
  if (from) params.from = from;
  if (to) params.to = to;
  
  const response = await api.get(`/competitors/${clientId}/posts`, { params });
  return response.data;
};

export const getClientSummary = async (clientId, platform) => {
  const params = {};
  if (platform) params.platform = platform;
  
  const response = await api.get(`/competitors/${clientId}/summary`, { params });
  return response.data;
};
