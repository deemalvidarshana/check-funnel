const STORAGE_VERSION = "v1";
const TOAST_STORAGE_KEY = `check-funnel.issue-board.pending-toast.${STORAGE_VERSION}`;

const getUserKey = (user) => {
  if (user?.id) return `user-${user.id}`;
  if (user?.email) return `email-${user.email}`;
  return "guest";
};

export const getStoredIssueBoardUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getIssueBoardStorageKey = (user) => (
  `check-funnel.issue-board.${getUserKey(user)}.${STORAGE_VERSION}`
);

export const loadStoredIssues = (user) => {
  try {
    const storedIssues = window.localStorage.getItem(getIssueBoardStorageKey(user));
    if (!storedIssues) return [];

    const parsedIssues = JSON.parse(storedIssues);
    return Array.isArray(parsedIssues) ? parsedIssues : [];
  } catch (error) {
    console.error("Failed to load issue board data", error);
    return [];
  }
};

export const saveStoredIssues = (user, issues) => {
  try {
    window.localStorage.setItem(getIssueBoardStorageKey(user), JSON.stringify(issues));
  } catch (error) {
    console.error("Failed to save issue board data", error);
  }
};

export const saveIssueBoardToast = (toast) => {
  try {
    window.sessionStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify(toast));
  } catch (error) {
    console.error("Failed to save issue board toast", error);
  }
};

export const takeIssueBoardToast = () => {
  try {
    const storedToast = window.sessionStorage.getItem(TOAST_STORAGE_KEY);
    window.sessionStorage.removeItem(TOAST_STORAGE_KEY);
    return storedToast ? JSON.parse(storedToast) : null;
  } catch (error) {
    console.error("Failed to load issue board toast", error);
    return null;
  }
};
