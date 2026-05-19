import api from './index';

export const generateCalendarAI = async (prompt) => {
  const response = await api.post('/ai/generate-calendar', { prompt });
  return response.data;
};

export const generateTargetsAI = async (payload) => {
  const response = await api.post('/ai/generate-targets', payload);
  return response.data;
};
