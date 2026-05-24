import api from './index';

export const getInstagramInsights = async (pageId, accessToken, until, timeRange) => {
  const response = await api.post('/instagram/insights', {
    pageId,
    accessToken,
    until,
    timeRange,
  });
  return response.data;
};

export const getInstagramRangeInsights = async (pageId, accessToken, ranges) => {
  const response = await api.post('/instagram/range-insights', {
    pageId,
    accessToken,
    ranges,
  });
  return response.data;
};
