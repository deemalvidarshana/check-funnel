import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

export const getPublicClientInfo = async (shareToken) => {
  const response = await publicApi.get(`/public-insights/info/${shareToken}`);
  return response.data;
};

export const getPublicFacebookInsights = async (shareToken, since, until) => {
  const response = await publicApi.get(`/public-insights/facebook/${shareToken}`, {
    params: { since, until }
  });
  return response.data;
};

export const getPublicInstagramInsights = async (shareToken, timeRange) => {
  const response = await publicApi.get(`/public-insights/instagram/${shareToken}`, {
    params: { timeRange }
  });
  return response.data;
};

export const getPublicTiktokInsights = async (shareToken) => {
  const response = await publicApi.get(`/public-insights/tiktok/${shareToken}`);
  return response.data;
};

export const getPublicCompetitorSummary = async (shareToken, platform, method) => {
  const response = await publicApi.get(`/public-insights/competitor-summary/${shareToken}`, {
    params: { platform, method }
  });
  return response.data;
};

export const getPublicCompetitorPosts = async (shareToken, platform, method, from, to) => {
  const response = await publicApi.get(`/public-insights/competitor-posts/${shareToken}`, {
    params: { platform, method, from, to }
  });
  return response.data;
};

export const getPublicPostDetails = async (shareToken, postId) => {
  const response = await publicApi.get(`/public-insights/post-details/${shareToken}/${postId}`);
  return response.data;
};
