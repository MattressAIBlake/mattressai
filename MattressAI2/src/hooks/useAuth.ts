import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { SignUpData } from '../services/auth/types';
import { handleAuthError } from '../services/auth/errors';

export const useAuth = () => {
  const { addToast } = useToastStore();
  const {
    user,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword
  } = useAuthStore();

  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      await signIn(email, password);
      addToast('success', 'Successfully signed in!');
    } catch (error) {
      const authError = handleAuthError(error);
      addToast('error', authError.message);
      throw authError;
    }
  }, [signIn, addToast]);

  const handleSignUp = useCallback(async (data: SignUpData) => {
    try {
      await signUp(data);
      addToast('success', 'Account created successfully! Please verify your email.');
    } catch (error) {
      const authError = handleAuthError(error);
      addToast('error', authError.message);
      throw authError;
    }
  }, [signUp, addToast]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      addToast('success', 'Successfully signed in with Google!');
      window.location.href = '/';
    } catch (error) {
      const authError = handleAuthError(error);
      addToast('error', authError.message);
      throw authError;
    }
  }, [signInWithGoogle, addToast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      addToast('success', 'Successfully signed out!');
    } catch (error) {
      const authError = handleAuthError(error);
      addToast('error', authError.message);
      throw authError;
    }
  }, [logout, addToast]);

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      await resetPassword(email);
      addToast('success', 'Password reset email sent!');
    } catch (error) {
      const authError = handleAuthError(error);
      addToast('error', authError.message);
      throw authError;
    }
  }, [resetPassword, addToast]);

  return {
    user,
    isAuthenticated,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleGoogleSignIn,
    logout: handleLogout,
    resetPassword: handleResetPassword
  };
};