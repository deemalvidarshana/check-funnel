import api from "./index";

export const getGoogleAnalyticsAuthUrl = async () =>
  (await api.get("/google-analytics/auth-url")).data;
export const getGoogleAnalyticsAccounts = async () =>
  (await api.get("/google-analytics/accounts")).data;
export const testGoogleAnalyticsClient = async (clientId) =>
  (await api.get(`/google-analytics/clients/${clientId}/test`)).data;
export const getGoogleAnalyticsInsights = async (clientId, month, range = {}) =>
  (
    await api.get(`/google-analytics/clients/${clientId}/insights`, {
      params: { month, ...range },
      timeout: 90000,
    })
  ).data;
