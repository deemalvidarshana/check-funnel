import api from './index';

export const getIssues = async () => {
  const response = await api.get('/issues');
  return response.data;
};

export const getIssue = async (id) => {
  const response = await api.get(`/issues/${id}`);
  return response.data;
};

export const createIssue = async (issueData) => {
  const response = await api.post('/issues', issueData);
  return response.data;
};

export const updateIssue = async (id, issueData) => {
  const response = await api.patch(`/issues/${id}`, issueData);
  return response.data;
};

export const deleteIssue = async (id) => {
  const response = await api.delete(`/issues/${id}`);
  return response.data;
};
