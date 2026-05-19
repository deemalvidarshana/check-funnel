import api from './index';

export const getTargetSnapshot = async ({ platform, targetMonth, scopeClientId }) => {
  const response = await api.get('/targets', {
    params: {
      platform,
      targetMonth,
      ...(scopeClientId ? { scopeClientId } : {}),
    },
  });
  return response.data;
};

export const createTargetSnapshot = async (payload) => {
  const response = await api.post('/targets', payload);
  return response.data;
};
