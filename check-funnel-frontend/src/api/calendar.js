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

export const getCalendarSettings = async (clientId) => {
  const response = await api.get(`/calendars/settings/${clientId}`);
  return response.data;
};

export const saveCalendarSettings = async (clientId, settingsData) => {
  const response = await api.put(`/calendars/settings/${clientId}`, settingsData);
  return response.data;
};

export const deleteCalendar = async (id) => {
  const response = await api.delete(`/calendars/${id}`);
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/calendars/posts/${id}`);
  return response.data;
};

export const updatePost = async (id, data) => {
  const response = await api.patch(`/calendars/posts/${id}`, data);
  return response.data;
};
