import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { User } from '../types';
import { uploadAvatar as uploadToCloudinary } from './cloudinaryService';

// Get user profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'email' | 'createdAt'>>
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp()
  });

  // Also update Firebase Auth profile if display name or photo changed
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    
    if (updates.displayName) authUpdates.displayName = updates.displayName;
    if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
    
    if (Object.keys(authUpdates).length > 0) {
      await firebaseUpdateProfile(currentUser, authUpdates);
    }
  }
};

// Upload and update avatar using Cloudinary
export const uploadAndUpdateAvatar = async (uid: string, file: File): Promise<string> => {
  try {
    // Upload to Cloudinary (free, no billing!)
    const avatarUrl = await uploadToCloudinary(uid, file);
    
    // Update user profile with new avatar URL
    await updateUserProfile(uid, { photoURL: avatarUrl });
    
    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar. Please try again.');
  }
};

// Update avatar with existing URL
export const updateAvatar = async (uid: string, avatarUrl: string): Promise<void> => {
  await updateUserProfile(uid, { photoURL: avatarUrl });
};

// Generate public profile link
export const getPublicProfileLink = (uid: string): string => {
  return `${window.location.origin}/profile/${uid}`;
};

// Share profile using Web Share API
export const shareProfile = async (user: User): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${user.displayName}'s Profile`,
        text: `Check out ${user.displayName} on UniConnect!`,
        url: getPublicProfileLink(user.uid)
      });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  return false;
};

// Copy profile link to clipboard
export const copyProfileLink = async (uid: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(getPublicProfileLink(uid));
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

