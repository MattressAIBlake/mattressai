import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export const signUp = async (data: SignUpData) => {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  await updateProfile(user, { displayName: data.name });
  
  await setDoc(doc(db, 'users', user.uid), {
    email: data.email,
    name: data.name,
    companyName: data.companyName,
    role: 'merchant',
    createdAt: new Date().toISOString()
  });

  await sendEmailVerification(user);
  
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();
  
  return {
    user,
    role: userData?.role || 'merchant'
  };
};

export const signInWithGoogle = async () => {
  try {
    // Using redirect instead of popup for better compatibility
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const updateUserProfile = (user: User, data: { displayName?: string; photoURL?: string }) => {
  return updateProfile(user, data);
};

export const resendVerificationEmail = (user: User) => sendEmailVerification(user);

export const setSuperAdmin = async (email: string) => {
  if (email === 'blake@themattressai.com') {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
    if (userDoc.exists()) {
      await setDoc(doc(db, 'users', userDoc.id), {
        role: 'superadmin',
        isSuperAdmin: true
      }, { merge: true });
    }
  }
};