import api from './index';

export const getAllUsers = async () => {
  const response = await api.get('/user');
  return response.data;
};

export const getAssignableUsers = async () => {
  try {
    const response = await api.get('/user/assignees');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const response = await api.get('/user');
      return response.data;
    }
    throw error;
  }
};

export const getPendingUsers = async () => {
  const response = await api.get('/user/pending');
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/user', data);
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await api.patch(`/user/${id}/status`, { status });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/user/${id}`);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.patch(`/user/${id}`, data);
  return response.data;
};

export const uploadAvatar = async (formData) => {
  const response = await api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
