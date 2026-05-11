import api from './index';

export const getSystemSettings = async () => {
  const response = await api.get('/system-settings');
  return response.data;
};

export const updateSystemSettings = async (data) => {
  const response = await api.patch('/system-settings', data);
  return response.data;
};
