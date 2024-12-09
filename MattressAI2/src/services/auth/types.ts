export interface SignUpData {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export interface UserRole {
  role: 'superadmin' | 'admin' | 'merchant' | 'user';
  permissions: string[];
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role?: UserRole['role'];
  permissions?: string[];
}