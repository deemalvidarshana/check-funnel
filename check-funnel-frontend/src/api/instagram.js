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
