import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig';
import { User } from '../types';

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Firebase Auth profile
  await firebaseUpdateProfile(user, {
    displayName,
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4f46e5&color=fff`
  });

  // Create Firestore user document
  const userDoc: Omit<User, 'uid'> = {
    email: user.email!,
    displayName,
    photoURL: user.photoURL || undefined,
    bio: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isOnline: true
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  return user;
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update online status
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    isOnline: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  return userCredential.user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user document exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    // Create new user document for first-time Google sign-in
    const newUserDoc: Omit<User, 'uid'> = {
      email: user.email!,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || undefined,
      bio: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isOnline: true
    };

    await setDoc(doc(db, 'users', user.uid), newUserDoc);
  } else {
    // Update online status
    await setDoc(doc(db, 'users', user.uid), {
      isOnline: true,
      lastSeen: serverTimestamp()
    }, { merge: true });
  }

  return user;
};

// Sign out
export const signOut = async (): Promise<void> => {
  const user = auth.currentUser;
  
  if (user) {
    // Update online status before signing out
    await setDoc(doc(db, 'users', user.uid), {
      isOnline: false,
      lastSeen: serverTimestamp()
    }, { merge: true });
  }

  await firebaseSignOut(auth);
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Get current user data from Firestore
export const getUserData = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  
  return null;
};

// Alias for signOut (for convenience)
export const logout = signOut;

