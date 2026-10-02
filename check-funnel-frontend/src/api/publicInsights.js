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

export const getPublicInstagramInsights = async (shareToken, timeRange, until) => {
  const response = await publicApi.get(`/public-insights/instagram/${shareToken}`, {
    params: { timeRange, until }
  });
  return response.data;
};

export const getPublicInstagramRangeInsights = async (shareToken, ranges) => {
  const response = await publicApi.post(`/public-insights/instagram-range/${shareToken}`, {
    ranges,
  });
  return response.data;
};

export const getPublicTiktokInsights = async (shareToken) => {
  const response = await publicApi.get(`/public-insights/tiktok/${shareToken}`);
  return response.data;
};

export const getPublicContentCalendars = async (shareToken) => {
  const response = await publicApi.get(`/public-insights/content-calendars/${shareToken}`);
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

export const getPublicPaidAdsInsights = async (shareToken, month, range = {}) => {
  const response = await publicApi.get(`/public-insights/paid-ads/${shareToken}/insights`, {
    params: { month, ...range },
    timeout: 90000,
  });
  return response.data;
};

export const getPublicPaidAdsMonthlyComparison = async (shareToken, months) => {
  const response = await publicApi.get(`/public-insights/paid-ads/${shareToken}/monthly-comparison`, {
    params: { months: months.join(',') },
    timeout: 90000,
  });
  return response.data;
};

export const getPublicPaidAdsRangeMonthlyComparison = async (shareToken, range) => {
  const response = await publicApi.get(`/public-insights/paid-ads/${shareToken}/range-monthly-comparison`, {
    params: range,
    timeout: 90000,
  });
  return response.data;
};
