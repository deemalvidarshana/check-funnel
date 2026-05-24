export const FEATURE_ACCESS = {
  contentCalendar: {
    label: 'Content Calendar',
    paths: ['/content-calendar'],
  },
  competitors: {
    label: 'Competitors',
    paths: ['/competitors'],
  },
  clients: {
    label: 'Clients',
    paths: ['/clients'],
  },
  targets: {
    label: 'Targets',
    paths: ['/targets', '/clients/:id/targets'],
  },
};

export const FEATURE_OPTIONS = Object.entries(FEATURE_ACCESS).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const getFeatureAccess = (user = getStoredUser()) => {
  if (Array.isArray(user?.featureAccess)) return user.featureAccess;
  if (typeof user?.featureAccess === 'string') {
    try {
      const parsed = JSON.parse(user.featureAccess);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const canManageFeature = (feature, user = getStoredUser()) => {
  if (user?.role === 'admin') return true;
  if (user?.role !== 'manager') return false;
  return getFeatureAccess(user).includes(feature);
};

export const canViewFeature = (feature, user = getStoredUser()) => (
  user?.role === 'admin' || user?.role === 'viewer' || user?.role === 'manager'
);
