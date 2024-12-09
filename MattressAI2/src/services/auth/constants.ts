export const AUTH_ERROR_CODES = {
  POPUP_BLOCKED: 'auth/popup-blocked',
  INVALID_EMAIL: 'auth/invalid-email',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  EMAIL_EXISTS: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_ERROR: 'auth/network-request-failed'
} as const;

export const AUTH_ERROR_MESSAGES = {
  [AUTH_ERROR_CODES.POPUP_BLOCKED]: 'Popup was blocked by your browser. Please allow popups or try another sign-in method.',
  [AUTH_ERROR_CODES.INVALID_EMAIL]: 'The email address is invalid.',
  [AUTH_ERROR_CODES.USER_DISABLED]: 'This account has been disabled.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'No account found with this email.',
  [AUTH_ERROR_CODES.WRONG_PASSWORD]: 'Incorrect password.',
  [AUTH_ERROR_CODES.EMAIL_EXISTS]: 'An account already exists with this email.',
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: 'Password should be at least 6 characters.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many attempts. Please try again later.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  DEFAULT: 'An error occurred. Please try again.'
} as const;

export const SUPER_ADMIN_EMAIL = 'blake@themattressai.com';