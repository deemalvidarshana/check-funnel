import api from './index';

export const generateCalendarAI = async (prompt) => {
  const response = await api.post('/ai/generate-calendar', { prompt });
  return response.data;
};
