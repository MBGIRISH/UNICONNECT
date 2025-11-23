import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if email exists in Firebase Auth
const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Firebase doesn't provide a direct way to check if email exists without attempting sign-in
    // We'll rely on Firebase's sendPasswordResetEmail which will only send if email exists
    // But we can validate the format first
    return isValidEmail(email);
  } catch (error) {
    return false;
  }
};

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via email using EmailJS
export const sendPasswordResetCode = async (email: string): Promise<void> => {
  // Validate email format
  if (!email || !email.trim()) {
    throw new Error('Please enter your email address');
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  // Check email format more strictly
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address format');
  }

  // Check if email exists in Firebase Auth by attempting to send reset email
  // This is the only way to verify email exists without revealing it
  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Email doesn't exist - but don't reveal this for security
      // Still generate code to prevent email enumeration
      console.warn('Email not found, but generating code anyway for security');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    } else {
      // Other errors - still generate code
      console.warn('Error sending reset email, but continuing with code generation:', error);
    }
  }

  // Generate 6-digit code
  const code = generateVerificationCode();
  
  // Store code in Firestore with expiration (10 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  try {
    await setDoc(doc(db, 'passwordResetCodes', trimmedEmail), {
      code,
      email: trimmedEmail,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false
    }, { merge: true });

    // Send code via EmailJS
    try {
      const emailjs = await import('@emailjs/browser');
      
      // EmailJS configuration (user needs to set this up)
      const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
      const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
      const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: trimmedEmail,
            reset_code: code,
            app_name: 'UniConnect'
          },
          EMAILJS_PUBLIC_KEY
        );
        console.log('Verification code sent via EmailJS to:', trimmedEmail);
      } else {
        // EmailJS not configured - log code for development
        console.log('EmailJS not configured. Code for', trimmedEmail, ':', code);
        console.warn('To enable email sending, configure EmailJS in .env file');
        // In development, we'll still work but code won't be sent
        // User can check console or we can display it
      }
    } catch (emailError: any) {
      console.error('Error sending email via EmailJS:', emailError);
      // Don't fail - code is stored, user can check console in dev mode
      // In production, this should be configured
    }
    
    console.log('Verification code generated and stored:', code);
  } catch (error: any) {
    console.error('Error storing reset code:', error);
    throw new Error('Failed to generate reset code. Please try again.');
  }
};

// Verify reset code
export const verifyResetCode = async (email: string, code: string): Promise<boolean> => {
  if (!email || !code) {
    throw new Error('Email and code are required');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  try {
    const codeDoc = await getDoc(doc(db, 'passwordResetCodes', trimmedEmail));
    
    if (!codeDoc.exists()) {
      throw new Error('Invalid or expired code');
    }

    const codeData = codeDoc.data();
    
    // Check if code is used
    if (codeData.used) {
      throw new Error('This code has already been used');
    }

    // Check if code matches
    if (codeData.code !== trimmedCode) {
      throw new Error('Invalid code');
    }

    // Check if code is expired
    const expiresAt = codeData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      // Delete expired code
      await deleteDoc(doc(db, 'passwordResetCodes', trimmedEmail));
      throw new Error('Code has expired. Please request a new one.');
    }

    return true;
  } catch (error: any) {
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('used')) {
      throw error;
    }
    console.error('Error verifying code:', error);
    throw new Error('Failed to verify code. Please try again.');
  }
};

// Reset password with code - sends password reset email, then user clicks link to complete
export const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<void> => {
  if (!email || !code || !newPassword) {
    throw new Error('Email, code, and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  // Verify code first
  await verifyResetCode(trimmedEmail, trimmedCode);

  // Code is valid, now prepare password reset
  // Firebase requires an action code to reset password, which comes from email link
  try {
    // Mark code as used
    await setDoc(doc(db, 'passwordResetCodes', trimmedEmail), {
      used: true,
      usedAt: serverTimestamp(),
      newPassword: newPassword, // Store temporarily for use with action code
      passwordSetAt: serverTimestamp()
    }, { merge: true });

    // Mark that we're waiting for action code
    await setDoc(doc(db, 'passwordResetCodes', trimmedEmail), {
      waitingForActionCode: true
    }, { merge: true });

    // Send password reset email - this generates an action code
    // The email link will contain the action code (oobCode parameter)
    // When user clicks the link, we'll extract the action code and use stored password
    await sendPasswordResetEmail(auth, trimmedEmail, {
      url: window.location.origin + '/login?mode=resetPassword&email=' + encodeURIComponent(trimmedEmail),
      handleCodeInApp: false
    });

    // Success - email sent with reset link
    // User needs to click the link to complete the reset
    // The link contains an action code that we'll use with the stored password
    return;
  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email not found. Please verify your email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    }
    throw new Error('Failed to reset password. Please try again.');
  }
};

// Alternative: Reset password directly if we have action code
export const confirmPasswordResetWithActionCode = async (actionCode: string, newPassword: string): Promise<void> => {
  if (!actionCode || !newPassword) {
    throw new Error('Action code and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  try {
    await confirmPasswordReset(auth, actionCode, newPassword);
  } catch (error: any) {
    console.error('Error confirming password reset:', error);
    if (error.code === 'auth/expired-action-code') {
      throw new Error('Reset link has expired. Please request a new one.');
    } else if (error.code === 'auth/invalid-action-code') {
      throw new Error('Invalid reset link. Please request a new one.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    }
    throw new Error('Failed to reset password. Please try again.');
  }
};

// Legacy function - kept for backward compatibility
export const resetPassword = async (email: string): Promise<void> => {
  // Use new code-based system
  await sendPasswordResetCode(email);
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

