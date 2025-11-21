import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  serverTimestamp,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Block a user
export const blockUser = async (blockerId: string, blockedUserId: string): Promise<void> => {
  if (blockerId === blockedUserId) {
    throw new Error('Cannot block yourself');
  }

  const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
  
  await setDoc(blockRef, {
    blockedUserId,
    blockedAt: serverTimestamp()
  });
};

// Unblock a user
export const unblockUser = async (blockerId: string, blockedUserId: string): Promise<void> => {
  const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
  await deleteDoc(blockRef);
};

// Check if user is blocked
export const isUserBlocked = async (blockerId: string, blockedUserId: string): Promise<boolean> => {
  const blockRef = doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
  const blockDoc = await getDoc(blockRef);
  return blockDoc.exists();
};

// Get list of blocked users
export const getBlockedUsers = async (userId: string): Promise<string[]> => {
  const blockedUsersRef = collection(db, 'users', userId, 'blockedUsers');
  const snapshot = await getDocs(blockedUsersRef);
  return snapshot.docs.map(doc => doc.id);
};

// Report a user
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: string,
  description: string
): Promise<void> => {
  await addDoc(collection(db, 'reports'), {
    type: 'user',
    reporterId,
    reportedUserId,
    reportedContentId: null,
    reason,
    description,
    status: 'pending', // pending, reviewed, resolved
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    resolution: null
  });
};

// Report a post
export const reportPost = async (
  reporterId: string,
  postId: string,
  postAuthorId: string,
  reason: string,
  description: string
): Promise<void> => {
  await addDoc(collection(db, 'reports'), {
    type: 'post',
    reporterId,
    reportedUserId: postAuthorId,
    reportedContentId: postId,
    reason,
    description,
    status: 'pending',
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    resolution: null
  });
};

// Report a comment
export const reportComment = async (
  reporterId: string,
  commentId: string,
  commentAuthorId: string,
  postId: string,
  reason: string,
  description: string
): Promise<void> => {
  await addDoc(collection(db, 'reports'), {
    type: 'comment',
    reporterId,
    reportedUserId: commentAuthorId,
    reportedContentId: commentId,
    postId,
    reason,
    description,
    status: 'pending',
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    resolution: null
  });
};

// Get user's reports
export const getUserReports = async (userId: string): Promise<any[]> => {
  const q = query(
    collection(db, 'reports'),
    where('reporterId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

