import api from './api';

export const getClients = async () => {
  const response = await api.get('/clients');
  return response.data;
};

export const createClient = async (clientData) => {
  const formData = new FormData();
  Object.keys(clientData).forEach(key => {
    formData.append(key, clientData[key]);
  });
  const response = await api.post('/clients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateClient = async (id, clientData) => {
  const formData = new FormData();
  Object.keys(clientData).forEach(key => {
    formData.append(key, clientData[key]);
  });
  const response = await api.patch(`/clients/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};
