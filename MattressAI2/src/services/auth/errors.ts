import { FirebaseError } from 'firebase/app';
import { AUTH_ERROR_MESSAGES } from './constants';

export class AuthError extends Error {
  code: string;
  
  constructor(error: FirebaseError) {
    const message = AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES] 
      || AUTH_ERROR_MESSAGES.DEFAULT;
    
    super(message);
    this.code = error.code;
    this.name = 'AuthError';
  }
}

export const handleAuthError = (error: unknown): AuthError => {
  if (error instanceof FirebaseError) {
    return new AuthError(error);
  }
  return new AuthError({ 
    code: 'unknown', 
    message: 'An unknown error occurred',
    name: 'FirebaseError'
  });
};