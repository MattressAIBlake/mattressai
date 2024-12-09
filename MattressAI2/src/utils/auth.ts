import { useAuthStore } from '../stores/authStore';

export const getAuthHeaders = () => {
  const { user } = useAuthStore.getState();
  return user ? { Authorization: `Bearer ${user.getIdToken()}` } : {};
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    return Date.now() >= decodedPayload.exp * 1000;
  } catch {
    return true;
  }
};

export const hasPermission = (permission: string): boolean => {
  const { permissions } = useAuthStore.getState();
  return permissions.includes(permission);
};