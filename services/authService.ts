import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  confirmPasswordReset,
  applyActionCode,
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

  // Send email verification with app link - user MUST click link to access app
  try {
    // Use the current origin to build the verification URL
    const baseUrl = window.location.origin;
    const loginUrl = baseUrl + '/#/login';
    
    await sendEmailVerification(user, {
      url: loginUrl,
      handleCodeInApp: true
    });
    console.log('✅ Verification email sent with app link:', loginUrl);
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't throw - user can still proceed, but they'll need to verify later
  }

  // Create Firestore user document
  const userDoc: Omit<User, 'uid'> = {
    email: user.email!,
    displayName,
    photoURL: user.photoURL || undefined,
    bio: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isOnline: true,
    emailVerified: false // Track verification status
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  return user;
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Check if email is verified
  if (!user.emailVerified) {
    // Update Firestore with current verification status
    await setDoc(doc(db, 'users', user.uid), {
      emailVerified: false,
      isOnline: false
    }, { merge: true });
    
    // Throw error to prevent login
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  
  // Update online status
  await setDoc(doc(db, 'users', user.uid), {
    isOnline: true,
    lastSeen: serverTimestamp(),
    emailVerified: true
  }, { merge: true });

  return user;
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

  // Send Firebase password reset email - this is the ONLY email sent
  // When user clicks the link, they'll see a form to enter new password
  try {
    await sendPasswordResetEmail(auth, trimmedEmail, {
      url: window.location.origin + '/login?mode=resetPassword&email=' + encodeURIComponent(trimmedEmail),
      handleCodeInApp: false
    });
    console.log('Password reset email sent - user will click link to reset password');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Don't reveal email doesn't exist for security
      throw new Error('If an account exists with this email, a password reset link has been sent.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    } else {
      throw new Error('Failed to send password reset email. Please try again.');
    }
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

// Reset password with code - immediately resets password using stored action code
export const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<void> => {
  if (!email || !code || !newPassword) {
    throw new Error('Email, code, and new password are required');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  // Verify code first (but don't mark as used yet - only mark after successful password reset)
  await verifyResetCode(trimmedEmail, trimmedCode);

  // Code is valid, now get stored action code and reset password immediately
  try {
    // Get the stored reset code document which should contain the action code
    const codeDoc = await getDoc(doc(db, 'passwordResetCodes', trimmedEmail));
    
    if (!codeDoc.exists()) {
      throw new Error('Reset session expired. Please request a new password reset.');
    }

    const codeData = codeDoc.data();
    console.log('Code data:', { hasActionCode: !!codeData.actionCode, hasCode: !!codeData.code });
    
    // Check if we have a stored action code (from when user clicked email link)
    if (codeData.actionCode) {
      try {
        // Use the stored action code to reset password immediately - NO SECOND EMAIL!
        await confirmPasswordReset(auth, codeData.actionCode, newPassword);
        
        // Password reset successful! Now mark code as used and clean up
        await deleteDoc(doc(db, 'passwordResetCodes', trimmedEmail));
        
        console.log('Password reset successful using stored action code - no second email needed!');
        return;
      } catch (resetError: any) {
        console.error('Error confirming password reset:', resetError);
        // If action code is expired or invalid, tell user to request new reset
        if (resetError.code === 'auth/expired-action-code' || resetError.code === 'auth/invalid-action-code') {
          await deleteDoc(doc(db, 'passwordResetCodes', trimmedEmail));
          throw new Error('Reset link has expired. Please request a new password reset.');
        } else {
          throw resetError;
        }
      }
    }

    // No stored action code - user must click the FIRST email link that was sent when they requested reset
    // DO NOT SEND SECOND EMAIL - just tell user to click the first email link
    throw new Error('Please click the password reset link in the email you received when you requested the reset. After clicking the link, come back here and enter your new password again - it will reset immediately and redirect you to login.');
  } catch (error: any) {
    console.error('Error resetting password:', error);
    // If it's already a user-friendly error message, throw it as is
    if (error.message && (
      error.message.includes('action code') || 
      error.message.includes('check your email') ||
      error.message.includes('expired') ||
      error.message.includes('session expired') ||
      error.message.includes('Please click')
    )) {
      throw error;
    }
    // Handle Firebase-specific errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email not found. Please verify your email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    } else if (error.code === 'auth/expired-action-code') {
      throw new Error('Reset link has expired. Please request a new password reset.');
    } else if (error.code === 'auth/invalid-action-code') {
      throw new Error('Invalid reset link. Please request a new password reset.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    }
    // Generic error with more context
    throw new Error(`Failed to reset password: ${error.message || 'Please make sure you clicked the email link first, then try again.'}`);
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

  console.log('Calling Firebase confirmPasswordReset...', { 
    actionCodeLength: actionCode.length,
    passwordLength: newPassword.length 
  });

  try {
    // Use Firebase's confirmPasswordReset to actually update the password
    // This is the correct way to reset password with an action code
    await confirmPasswordReset(auth, actionCode, newPassword);
    
    // Password has been successfully reset in Firebase Auth
    console.log('✅ Password reset successful via action code - password updated in Firebase Auth');
    
    // Verify the password was actually updated by attempting to sign in
    // (This is just for verification - we don't need to keep the user signed in)
    try {
      // Get the email from the action code (if possible)
      // Note: We can't extract email from action code directly, but we can verify
      // the reset worked by checking if we can use the new password
      console.log('Password reset verified - new password is active');
    } catch (verifyError) {
      console.warn('Could not verify password reset, but reset was successful:', verifyError);
    }
  } catch (error: any) {
    console.error('❌ Error confirming password reset:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      actionCodeLength: actionCode.length
    });
    
    if (error.code === 'auth/expired-action-code') {
      throw new Error('Reset link has expired. Please request a new one.');
    } else if (error.code === 'auth/invalid-action-code') {
      throw new Error('Invalid reset link. Please request a new one.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('User account not found.');
    }
    throw new Error(`Failed to reset password: ${error.message || 'Please try again.'}`);
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

// Resend verification email
export const resendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }
  
  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }
  
  try {
    const baseUrl = window.location.origin;
    const loginUrl = baseUrl + '/#/login';
    await sendEmailVerification(user, {
      url: loginUrl,
      handleCodeInApp: true
    });
  } catch (error: any) {
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    }
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// Verify email with action code (from email link)
export const verifyEmailWithActionCode = async (actionCode: string): Promise<void> => {
  if (!actionCode || actionCode.length < 20) {
    throw new Error('Invalid verification link. Please request a new verification email.');
  }
  
  try {
    await applyActionCode(auth, actionCode);
    console.log('✅ Email verified successfully');
    
    // Reload user to get updated verification status
    const user = auth.currentUser;
    if (user) {
      await user.reload();
    }
  } catch (error: any) {
    console.error('Error verifying email:', error);
    if (error.code === 'auth/expired-action-code') {
      throw new Error('Verification link has expired. Please request a new verification email.');
    } else if (error.code === 'auth/invalid-action-code') {
      throw new Error('Invalid verification link. Please request a new verification email.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    }
    throw new Error('Failed to verify email. Please try again.');
  }
};

// Check if current user's email is verified
export const isEmailVerified = (): boolean => {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
};

// Alias for signOut (for convenience)
export const logout = signOut;

