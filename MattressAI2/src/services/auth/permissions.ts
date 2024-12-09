export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_BRANDS: 'manage_brands',
  MANAGE_SESSIONS: 'manage_sessions',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_SESSIONS,
  ],
  merchant: [
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_BRANDS,
  ],
  user: [PERMISSIONS.VIEW_ANALYTICS],
};

export const getRolePermissions = (role: string): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};