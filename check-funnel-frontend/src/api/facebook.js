import api from './index';

export const getFacebookInsights = async (pageId, accessToken, since, until) => {
  const response = await api.post('/facebook/fb-insights', {
    pageId,
    accessToken,
    since,
    until,
  });
  return response.data;
};
