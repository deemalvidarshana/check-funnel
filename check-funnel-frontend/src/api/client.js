import api from './index';

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
    const val = clientData[key];
    if (val !== undefined && val !== null) {
      // For logo, only append if it's a File object (new upload)
      if (key === 'logo') {
        if (val instanceof File) {
          formData.append(key, val);
        }
      } else {
        formData.append(key, val);
      }
    }
  });
  const response = await api.patch(`/clients/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getClientById = async (id) => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

export const toggleShare = async (id, isShared) => {
  const response = await api.patch(`/clients/${id}/share`, { isShared });
  return response.data;
};

export const getClientInsightsReportData = async (id, platform, ranges) => {
  const response = await api.get(`/clients/${id}/insights-report`, {
    params: { ...(platform ? { platform } : {}), ...(ranges || {}) },
    timeout: 60000,
  });
  return response.data;
};
