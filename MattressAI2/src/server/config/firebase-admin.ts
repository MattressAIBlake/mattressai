import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

// Initialize services
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

// Custom claims for user roles
export const CUSTOM_CLAIMS = {
  MERCHANT: 'merchant',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

// Helper functions for auth
export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await auth.getUserByEmail(email);
    return user;
  } catch (error) {
    throw new Error('User not found');
  }
};

export const setCustomClaims = async (uid: string, claims: Record<string, any>) => {
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    throw new Error('Failed to set custom claims');
  }
};

// Helper functions for Firestore
export const getTransaction = () => {
  return db.runTransaction.bind(db);
};

export const getBatch = () => {
  return db.batch();
};

// Collection references with security rules
export const collections = {
  merchants: db.collection('merchants'),
  chatbotConfigs: db.collection('chatbotConfigs'),
  leads: db.collection('leads'),
  conversations: db.collection('conversations'),
  analytics: db.collection('analytics')
};

// Security middleware
export const validateFirebaseIdToken = async (req: any, res: any, next: any) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).send('Unauthorized');
  }
};

// Merchant validation middleware
export const validateMerchant = async (req: any, res: any, next: any) => {
  try {
    const merchantDoc = await collections.merchants.doc(req.user.uid).get();
    
    if (!merchantDoc.exists) {
      res.status(404).send('Merchant not found');
      return;
    }

    req.merchant = merchantDoc.data();
    next();
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// Admin validation middleware
export const validateAdmin = async (req: any, res: any, next: any) => {
  try {
    const { admin } = req.user;
    
    if (!admin) {
      res.status(403).send('Admin access required');
      return;
    }

    next();
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// Super admin validation middleware
export const validateSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    const { superAdmin } = req.user;
    
    if (!superAdmin) {
      res.status(403).send('Super admin access required');
      return;
    }

    next();
  } catch (error) {
    res.status(500).send('Server error');
  }
};

export default admin; 