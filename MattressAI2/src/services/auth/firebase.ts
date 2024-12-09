import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Merchant } from '../../models';

// Initialize providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export interface AuthError {
  code: string;
  message: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  company: string;
}

export interface AuthResponse {
  user: User;
  merchant?: Merchant;
  isNewUser: boolean;
}

class FirebaseAuthService {
  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Sign in with email/password
  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const merchant = await this.getMerchantData(user.uid);
    return { user, merchant, isNewUser: false };
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthResponse> {
    const result = await signInWithPopup(auth, googleProvider);
    const { isNewUser } = getAdditionalUserInfo(result) || { isNewUser: false };
    
    // If new user, create merchant profile
    if (isNewUser) {
      await this.createMerchantProfile(result.user);
    }
    
    const merchant = await this.getMerchantData(result.user.uid);
    return { user: result.user, merchant, isNewUser };
  }

  // Sign up with email/password
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Create merchant profile
    const merchant = await this.createMerchantProfile(user, {
      name: data.name,
      company: data.company
    });
    
    return { user, merchant, isNewUser: true };
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get merchant data
  private async getMerchantData(userId: string): Promise<Merchant | undefined> {
    const merchantDoc = await getDoc(doc(db, 'merchants', userId));
    return merchantDoc.exists() ? merchantDoc.data() as Merchant : undefined;
  }

  // Create merchant profile
  private async createMerchantProfile(
    user: User,
    additionalData?: { name?: string; company?: string }
  ): Promise<Merchant> {
    const merchant: Merchant = {
      id: user.uid,
      name: additionalData?.company || user.displayName || '',
      slug: this.generateSlug(additionalData?.company || user.displayName || ''),
      status: 'active',
      verified: false,
      contacts: [{
        name: additionalData?.name || user.displayName || '',
        email: user.email || '',
        role: 'primary'
      }],
      type: 'retail',
      storeCount: 1,
      employeeCount: 1,
      branding: {
        colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          background: '#ffffff',
          text: '#000000'
        },
        fonts: {
          primary: 'Inter',
          secondary: 'system-ui'
        }
      },
      preferences: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        measurementUnit: 'imperial'
      },
      subscription: {
        plan: 'free',
        status: 'active',
        subscriptionId: '',
        currentPeriod: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        features: ['basic_chat', 'lead_capture'],
        limits: {
          conversations: 100,
          leads: 50,
          teamMembers: 1,
          storage: 1
        }
      },
      metrics: {
        totalLeads: 0,
        totalConversations: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        lastActivityAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    await setDoc(doc(db, 'merchants', user.uid), {
      ...merchant,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return merchant;
  }

  // Generate URL-friendly slug from company name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const firebaseAuth = new FirebaseAuthService();