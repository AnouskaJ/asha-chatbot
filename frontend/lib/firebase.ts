import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { UserProfile } from '@/types/user';

const firebaseConfig = {
  apiKey: "AIzaSyDB3RSnurgvV8kVYPOpvh4NUC9G9FlUfCg",
  authDomain: "asha-ai.firebaseapp.com",
  projectId: "asha-ai",
  storageBucket: "asha-ai.firebasestorage.app",
  messagingSenderId: "441392935110",
  appId: "1:441392935110:web:1e3613f204815442fa27c7",
  measurementId: "G-NZ5PSCQYB4"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// Authentication functions
// — Note: added `rememberMe` parameter and `setPersistence` call
export const loginUser = async (
  email: string,
  password: string,
  rememberMe: boolean = false
) => {
  try {
    // ** NEW: set persistence based on rememberMe **
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update user's last active time and session count
    try {
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await setDoc(userRef, {
          ...userData,
          lastActive: Date.now(),
          sessionCount: (userData.sessionCount || 0) + 1,
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        // Create user document if it doesn't exist
        await saveUserToFirestore(userCredential.user.uid, {
          email: email,
          createdAt: Date.now(),
          lastActive: Date.now(),
          sessionCount: 1
        });
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
      // Don't block login if this fails
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error.message);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, profileData?: Partial<UserProfile>) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Save basic user data to Firestore
    const baseUserData = {
      email: email,
      createdAt: Date.now(),
      lastActive: Date.now(),
      sessionCount: 1
    };
    
    await saveUserToFirestore(userCredential.user.uid, baseUserData);
    
    // Save profile data if provided
    if (profileData) {
      await saveUserProfile(userCredential.user.uid, {
        ...profileData,
        email,
        uid: userCredential.user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error.message);
    throw error;
  }
};

// Function to save user data to Firestore
export const saveUserToFirestore = async (uid: string, userData: any) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...userData,
      updatedAt: Date.now()
    });
    console.log('User data saved to Firestore');
  } catch (error: any) {
    console.error('Error saving user data:', error);
    // Don't throw the error to prevent blocking registration
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error.message);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Admin check function
export const isAdmin = async (uid: string) => {
  try {
    // Wait for auth to be initialized
    if (!auth.currentUser) {
      console.log('No authenticated user found');
      return false;
    }

    console.log('Current user UID:', auth.currentUser.uid);
    console.log('Checking admin status for UID:', uid);

    // Verify the UIDs match
    if (auth.currentUser.uid !== uid) {
      console.error('UID mismatch - current user:', auth.currentUser.uid, 'requested UID:', uid);
      return false;
    }

    // Get the ID token to ensure we have fresh credentials
    const idToken = await auth.currentUser.getIdToken(true);
    console.log('Got fresh ID token');

    const adminDocRef = doc(db, 'admins', uid);
    console.log('Checking admin document path:', adminDocRef.path);
    
    const adminDoc = await getDoc(adminDocRef);
    console.log('Admin doc data:', adminDoc.data());
    console.log('Admin check result:', adminDoc.exists());
    
    if (!adminDoc.exists()) {
      console.log('Admin document does not exist for UID:', uid);
      return false;
    }

    // Log the admin document data
    const adminData = adminDoc.data();
    console.log('Admin document data:', adminData);

    return true;
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
};

// Function to save user profile data
export const saveUserProfile = async (uid: string, profileData: Partial<UserProfile>) => {
  try {
    const profileRef = doc(db, 'profiles', uid);
    await setDoc(profileRef, {
      ...profileData,
      updatedAt: Date.now()
    }, { merge: true });
    console.log('User profile saved to Firestore');
    return true;
  } catch (error: any) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Function to get user profile data
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const profileRef = doc(db, 'profiles', uid);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      return profileDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
