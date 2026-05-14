import api from './index';

export const saveCalendar = async (calendarData) => {
  const response = await api.post('/calendars', calendarData);
  return response.data;
};

export const getCalendars = async (clientId) => {
  const params = {};
  if (clientId) params.clientId = clientId;
  const response = await api.get('/calendars', { params });
  return response.data;
};

export const getCalendarById = async (id) => {
  const response = await api.get(`/calendars/${id}`);
  return response.data;
};
